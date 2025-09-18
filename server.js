const express = require('express');

console.log('載入紫微斗數套件...');
const { DestinyBoard, DestinyConfigBuilder, DayTimeGround, ConfigType, Gender } = require('fortel-ziweidoushu');
console.log('套件載入成功！');

const app = express();
app.use(express.json());

// 根路徑
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Ziwei API Server is running!',
    endpoints: {
      'POST /ziwei': '排盤 API',
      'GET /health': '健康檢查',
      'GET /test-hours': '測試時辰'
    }
  });
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ziwei-api',
    timestamp: new Date().toISOString()
  });
});

// 測試時辰 - 詳細版本
app.get('/test-hours', (req, res) => {
  const testCases = ['子時', '寅時', '午時'];
  const results = testCases.map(testCase => {
    try {
      console.log('測試時辰:', testCase, '字節長度:', testCase.length, '字符碼:', [...testCase].map(c => c.charCodeAt(0)));
      
      // 直接測試 DayTimeGround
      const ground = DayTimeGround.getByName(testCase);
      return { 
        input: testCase,
        length: testCase.length,
        charCodes: [...testCase].map(c => c.charCodeAt(0)),
        status: 'success',
        ground: ground ? ground.toString() : 'null'
      };
    } catch (e) {
      return { 
        input: testCase,
        length: testCase.length, 
        charCodes: [...testCase].map(c => c.charCodeAt(0)),
        status: 'error', 
        error: e.message 
      };
    }
  });
  
  // 測試套件是否正常載入
  try {
    const testConfig = DestinyConfigBuilder.withSolar({
      year: 1990,
      month: 5,
      day: 15,
      bornTimeGround: DayTimeGround.getByName('寅時'),
      configType: ConfigType.SKY,
      gender: Gender.M
    });
    results.push({
      test: 'complete_test',
      status: 'success',
      message: '完整測試成功'
    });
  } catch (e) {
    results.push({
      test: 'complete_test', 
      status: 'error',
      error: e.message
    });
  }
  
  res.json(results);
});

// 紫微斗數排盤 API - 簡化版
app.post('/ziwei', (req, res) => {
  console.log('=== 收到排盤請求 ===');
  console.log('原始參數:', JSON.stringify(req.body, null, 2));
  
  try {
    const { year, month, day, hour, gender } = req.body;
    
    // 參數驗證
    if (!year || !month || !day || !hour || !gender) {
      return res.status(400).json({
        error: '參數不完整',
        required: ['year', 'month', 'day', 'hour', 'gender'],
        received: { year, month, day, hour, gender }
      });
    }
    
    // 詳細檢查時辰
    console.log('檢查時辰參數:');
    console.log('- 時辰值:', hour);
    console.log('- 時辰型別:', typeof hour);
    console.log('- 時辰長度:', hour.length);
    console.log('- 字符碼:', [...hour].map(c => c.charCodeAt(0)));
    
    // 清理時辰字串（移除可能的隱藏字符）
    const cleanHour = hour.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
    console.log('清理後時辰:', cleanHour, '長度:', cleanHour.length);
    
    // 測試時辰轉換
    console.log('測試 DayTimeGround.getByName...');
    let timeGround;
    try {
      timeGround = DayTimeGround.getByName(cleanHour);
      console.log('時辰轉換成功!', timeGround);
    } catch (timeError) {
      console.log('時辰轉換失敗:', timeError.message);
      
      // 嘗試其他可能的格式
      const alternatives = ['子時', '丑時', '寅時', '卯時', '辰時', '巳時', '午時', '未時', '申時', '酉時', '戌時', '亥時'];
      const found = alternatives.find(alt => {
        try {
          DayTimeGround.getByName(alt);
          return true;
        } catch {
          return false;
        }
      });
      
      return res.status(400).json({
        error: '時辰轉換失敗',
        原始時辰: hour,
        清理後時辰: cleanHour,
        時辰字符碼: [...cleanHour].map(c => c.charCodeAt(0)),
        錯誤訊息: timeError.message,
        測試結果: found ? `找到有效時辰: ${found}` : '所有標準時辰都無法使用',
        建議: '檢查套件版本或時辰格式'
      });
    }
    
    // 轉換性別
    const genderEnum = (gender === 'F' || gender === 'female' || gender === '女') ? Gender.F : Gender.M;
    console.log('性別轉換:', gender, '->', genderEnum === Gender.F ? 'F' : 'M');
    
    // 建立設定
    console.log('建立排盤設定...');
    const config = DestinyConfigBuilder.withSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      bornTimeGround: timeGround,
      configType: ConfigType.SKY,
      gender: genderEnum
    });
    console.log('設定建立成功');
    
    // 排盤
    console.log('開始排盤...');
    const destinyBoard = new DestinyBoard(config);
    console.log('排盤完成！');
    
    res.json({
      success: true,
      data: destinyBoard,
      debug: {
        原始時辰: hour,
        清理後時辰: cleanHour,
        轉換結果: timeGround?.toString(),
        性別轉換: genderEnum === Gender.F ? 'F' : 'M'
      }
    });
    
  } catch (e) {
    console.error('=== 排盤發生錯誤 ===');
    console.error('錯誤類型:', e.constructor.name);
    console.error('錯誤訊息:', e.message);
    console.error('錯誤堆疊:', e.stack);
    
    res.status(500).json({ 
      error: '排盤錯誤', 
      message: e.message,
      errorType: e.constructor.name,
      params: req.body
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`=== Ziwei API 啟動成功 ===`);
  console.log(`Server: http://0.0.0.0:${port}`);
  console.log(`API: http://0.0.0.0:${port}/ziwei`);
  console.log(`健康檢查: http://0.0.0.0:${port}/health`);
  console.log(`時辰測試: http://0.0.0.0:${port}/test-hours`);
  console.log('==============================');
});
