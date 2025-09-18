const express = require('express');
const { DestinyBoard, DestinyConfigBuilder, DayTimeGround, ConfigType, Gender } = require('fortel-ziweidoushu');

const app = express();
app.use(express.json({ limit: '1mb' }));

// 基本路由
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// 測試時辰格式
app.get('/test-time', (req, res) => {
  // 創建標準時辰字符串
  const standardTimes = {
    '子時': '子時',
    '丑時': '丑時', 
    '寅時': '寅時',
    '卯時': '卯時',
    '辰時': '辰時',
    '巳時': '巳時',
    '午時': '午時',
    '未時': '未時',
    '申時': '申時',
    '酉時': '酉時',
    '戌時': '戌時',
    '亥時': '亥時'
  };
  
  const results = Object.keys(standardTimes).map(timeStr => {
    try {
      const ground = DayTimeGround.getByName(timeStr);
      return { 
        time: timeStr, 
        charCodes: [...timeStr].map(c => c.charCodeAt(0)),
        status: 'success', 
        result: ground?.toString() 
      };
    } catch (e) {
      return { 
        time: timeStr, 
        charCodes: [...timeStr].map(c => c.charCodeAt(0)),
        status: 'error', 
        message: e.message 
      };
    }
  });
  
  res.json(results);
});

// 排盤 API - 使用標準時辰對照
app.post('/ziwei', (req, res) => {
  console.log('收到請求:', JSON.stringify(req.body));
  
  try {
    const { year, month, day, hour, gender } = req.body;
    
    if (!year || !month || !day || !hour || !gender) {
      return res.status(400).json({ error: '參數不完整' });
    }
    
    console.log('原始時辰:', hour, '字符碼:', [...hour].map(c => c.charCodeAt(0)));
    
    // 使用標準時辰對照表
    const timeMapping = {
      '子時': '子時', '丑時': '丑時', '寅時': '寅時', '卯時': '卯時',
      '辰時': '辰時', '巳時': '巳時', '午時': '午時', '未時': '未時', 
      '申時': '申時', '酉時': '酉時', '戌時': '戌時', '亥時': '亥時'
    };
    
    // 創建新的標準時辰字符串
    let standardHour = null;
    if (timeMapping[hour]) {
      standardHour = timeMapping[hour];
    } else {
      // 嘗試重新構建字符串
      if (hour.includes('子')) standardHour = '子時';
      else if (hour.includes('丑')) standardHour = '丑時';
      else if (hour.includes('寅')) standardHour = '寅時';
      else if (hour.includes('卯')) standardHour = '卯時';
      else if (hour.includes('辰')) standardHour = '辰時';
      else if (hour.includes('巳')) standardHour = '巳時';
      else if (hour.includes('午')) standardHour = '午時';
      else if (hour.includes('未')) standardHour = '未時';
      else if (hour.includes('申')) standardHour = '申時';
      else if (hour.includes('酉')) standardHour = '酉時';
      else if (hour.includes('戌')) standardHour = '戌時';
      else if (hour.includes('亥')) standardHour = '亥時';
    }
    
    console.log('標準時辰:', standardHour, '字符碼:', standardHour ? [...standardHour].map(c => c.charCodeAt(0)) : 'null');
    
    if (!standardHour) {
      return res.status(400).json({
        error: '無法識別時辰',
        原始時辰: hour,
        原始字符碼: [...hour].map(c => c.charCodeAt(0)),
        支援的時辰: Object.keys(timeMapping)
      });
    }
    
    // 測試時辰轉換
    let timeGround;
    try {
      timeGround = DayTimeGround.getByName(standardHour);
      console.log('時辰轉換成功:', standardHour, '->', timeGround);
    } catch (e) {
      console.log('時辰轉換失敗:', e.message);
      return res.status(400).json({
        error: '時辰轉換失敗',
        標準時辰: standardHour,
        錯誤: e.message
      });
    }
    
    // 轉換性別
    const genderEnum = (gender === 'F' || gender === 'female' || gender === '女') ? Gender.F : Gender.M;
    
    // 建立設定並排盤
    const config = DestinyConfigBuilder.withSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      bornTimeGround: timeGround,
      configType: ConfigType.SKY,
      gender: genderEnum
    });
    
    const destinyBoard = new DestinyBoard(config);
    console.log('排盤成功!');
    
    res.json({
      success: true,
      data: destinyBoard,
      meta: {
        原始時辰: hour,
        使用的標準時辰: standardHour,
        性別: genderEnum === Gender.F ? 'F' : 'M'
      }
    });
    
  } catch (e) {
    console.error('排盤錯誤:', e.message);
    res.status(500).json({ 
      error: '排盤錯誤', 
      message: e.message
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Ziwei API running on port ${port}`);
});
