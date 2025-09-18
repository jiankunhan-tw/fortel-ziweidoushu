const express = require('express');

// 先測試套件載入
console.log('開始載入套件...');
let ZiweiModule;
try {
  // 嘗試不同路徑
  ZiweiModule = require('./build/main');
  console.log('成功載入 ./build/main');
} catch (e1) {
  console.log('載入 ./build/main 失敗:', e1.message);
  try {
    ZiweiModule = require('fortel-ziweidoushu');
    console.log('成功載入 fortel-ziweidoushu');
  } catch (e2) {
    console.log('載入 fortel-ziweidoushu 失敗:', e2.message);
    console.log('所有載入方式都失敗了');
    process.exit(1);
  }
}

const { DestinyBoard, DestinyConfigBuilder, DayTimeGround, ConfigType, Gender } = ZiweiModule;

const app = express();
app.use(express.json());

// 根路徑測試
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Ziwei API Server is running!',
    endpoints: ['/ziwei', '/health'],
    module: ZiweiModule ? 'loaded' : 'not loaded'
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

// 測試時辰列表
app.get('/test-hours', (req, res) => {
  try {
    const hours = ['子時', '丑時', '寅時', '卯時', '辰時', '巳時', '午時', '未時', '申時', '酉時', '戌時', '亥時'];
    const testResults = hours.map(hour => {
      try {
        const ground = DayTimeGround.getByName(hour);
        return { hour, status: 'ok', ground: ground ? 'found' : 'not found' };
      } catch (e) {
        return { hour, status: 'error', error: e.message };
      }
    });
    res.json(testResults);
  } catch (e) {
    res.status(500).json({ error: 'Test failed', message: e.message });
  }
});

app.post('/ziwei', (req, res) => {
  console.log('=== 收到排盤請求 ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { year, month, day, hour, gender } = req.body;
    
    // 驗證必要參數
    if (!year || !month || !day || !hour || !gender) {
      console.log('缺少必要參數');
      return res.status(400).json({
        error: '參數不完整',
        required: ['year', 'month', 'day', 'hour', 'gender'],
        received: { year, month, day, hour, gender }
      });
    }
    
    console.log('解析參數:', {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour,
      gender
    });
    
    // 測試時辰轉換
    console.log('嘗試轉換時辰:', hour);
    let timeGround;
    try {
      timeGround = DayTimeGround.getByName(hour);
      console.log('時辰轉換成功:', timeGround);
    } catch (e) {
      console.log('時辰轉換失敗:', e.message);
      return res.status(400).json({
        error: '時辰格式錯誤',
        message: `無法識別時辰 "${hour}"，請使用：子時、丑時、寅時等`,
        details: e.message
      });
    }
    
    // 建立 config
    console.log('建立設定物件...');
    const config = DestinyConfigBuilder.withSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      bornTimeGround: timeGround,
      configType: ConfigType.SKY,
      gender: gender === 'F' || gender === '女' ? Gender.F : Gender.M
    });
    console.log('設定物件建立成功');
    
    // 產生命盤
    console.log('開始排盤...');
    const destinyBoard = new DestinyBoard(config);
    console.log('排盤完成！');
    
    // 回傳結果
    res.json({
      success: true,
      data: destinyBoard,
      meta: {
        timestamp: new Date().toISOString(),
        params: { year, month, day, hour, gender }
      }
    });
    
  } catch (e) {
    console.error('=== 排盤發生錯誤 ===');
    console.error('Error:', e);
    console.error('Stack:', e.stack);
    
    res.status(500).json({ 
      error: '排盤錯誤', 
      message: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
});

const port = process.env.PORT || 3000;

// 關鍵：監聽 0.0.0.0
app.listen(port, '0.0.0.0', () => {
  console.log(`=== Ziwei API 啟動成功 ===`);
  console.log(`Server running on: http://0.0.0.0:${port}`);
  console.log(`API endpoint: http://0.0.0.0:${port}/ziwei`);
  console.log(`Health check: http://0.0.0.0:${port}/health`);
  console.log(`Test hours: http://0.0.0.0:${port}/test-hours`);
  console.log('=====================================');
});
