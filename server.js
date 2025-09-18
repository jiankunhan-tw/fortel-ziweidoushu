const express = require('express');

// 直接使用 npm 套件
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

// 測試時辰
app.get('/test-hours', (req, res) => {
  const hours = ['子時', '丑時', '寅時', '卯時', '辰時', '巳時', '午時', '未時', '申時', '酉時', '戌時', '亥時'];
  const results = hours.map(hour => {
    try {
      const ground = DayTimeGround.getByName(hour);
      return { hour, status: 'ok' };
    } catch (e) {
      return { hour, status: 'error', error: e.message };
    }
  });
  res.json(results);
});

// 紫微斗數排盤 API
app.post('/ziwei', (req, res) => {
  console.log('=== 收到排盤請求 ===');
  console.log('參數:', req.body);
  
  try {
    const { year, month, day, hour, gender } = req.body;
    
    // 參數驗證
    if (!year || !month || !day || !hour || !gender) {
      return res.status(400).json({
        error: '參數不完整',
        required: ['year', 'month', 'day', 'hour', 'gender'],
        example: {
          year: 1990,
          month: 5,
          day: 15,
          hour: '寅時',
          gender: 'M'
        }
      });
    }
    
    console.log('轉換時辰:', hour);
    const timeGround = DayTimeGround.getByName(hour);
    
    console.log('建立設定...');
    const config = DestinyConfigBuilder.withSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      bornTimeGround: timeGround,
      configType: ConfigType.SKY,
      gender: (gender === 'F' || gender === '女') ? Gender.F : Gender.M
    });
    
    console.log('開始排盤...');
    const destinyBoard = new DestinyBoard(config);
    console.log('排盤成功！');
    
    res.json({
      success: true,
      data: destinyBoard
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
  console.log(`=== Ziwei API 啟動成功 ===`);
  console.log(`URL: http://0.0.0.0:${port}`);
  console.log(`API: http://0.0.0.0:${port}/ziwei`);
  console.log('==============================');
});
