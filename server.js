const express = require('express');

console.log('開始載入套件...');
try {
  const ziwei = require('fortel-ziweidoushu');
  console.log('套件載入成功，可用的導出:', Object.keys(ziwei));
  
  const { DestinyBoard, DestinyConfigBuilder, DayTimeGround, ConfigType, Gender } = ziwei;
  
  console.log('DestinyBoard:', typeof DestinyBoard);
  console.log('DestinyConfigBuilder:', typeof DestinyConfigBuilder);
  console.log('DayTimeGround:', typeof DayTimeGround);
  console.log('ConfigType:', typeof ConfigType);
  console.log('Gender:', typeof Gender);
  
  // 測試 DayTimeGround 是否有 getByName 方法
  if (DayTimeGround && typeof DayTimeGround.getByName === 'function') {
    console.log('DayTimeGround.getByName 方法存在');
  } else {
    console.log('警告: DayTimeGround.getByName 方法不存在!');
    console.log('DayTimeGround 的方法:', Object.getOwnPropertyNames(DayTimeGround));
  }

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 基本路由
  app.get('/', (req, res) => res.json({ 
    status: 'ok',
    package: 'fortel-ziweidoushu loaded',
    exports: Object.keys(ziwei)
  }));

  app.get('/health', (req, res) => res.json({ status: 'healthy' }));

  // 套件檢查
  app.get('/debug', (req, res) => {
    const debug = {
      packageLoaded: true,
      exports: Object.keys(ziwei),
      DestinyBoard: typeof DestinyBoard,
      DestinyConfigBuilder: typeof DestinyConfigBuilder,
      DayTimeGround: typeof DayTimeGround,
      hasGetByName: typeof DayTimeGround?.getByName === 'function',
      dayTimeGroundMethods: DayTimeGround ? Object.getOwnPropertyNames(DayTimeGround) : 'N/A'
    };
    
    res.json(debug);
  });

  // 直接測試套件功能
  app.get('/test-package', (req, res) => {
    try {
      // 嘗試使用文檔中的範例
      console.log('測試文檔範例...');
      const testConfig = DestinyConfigBuilder.withSolar({
        year: 1952,
        month: 4,
        day: 9,
        bornTimeGround: DayTimeGround.getByName('寅時'),
        configType: ConfigType.SKY,
        gender: Gender.F,
      });
      
      console.log('配置建立成功');
      const testBoard = new DestinyBoard(testConfig);
      console.log('命盤建立成功');
      
      res.json({
        status: 'success',
        message: '套件功能正常',
        testResult: {
          config: testConfig,
          boardCreated: true
        }
      });
      
    } catch (e) {
      console.error('套件測試失敗:', e);
      res.status(500).json({
        status: 'error',
        message: '套件測試失敗',
        error: e.message,
        stack: e.stack
      });
    }
  });

  // 排盤 API
  app.post('/ziwei', (req, res) => {
    console.log('收到排盤請求:', JSON.stringify(req.body));
    
    try {
      const { year, month, day, hour, gender } = req.body;
      
      if (!year || !month || !day || !hour || !gender) {
        return res.status(400).json({ error: '參數不完整' });
      }
      
      console.log('準備呼叫 DayTimeGround.getByName:', hour);
      
      // 直接測試是否有這個方法
      if (typeof DayTimeGround?.getByName !== 'function') {
        return res.status(500).json({
          error: '套件錯誤',
          message: 'DayTimeGround.getByName 方法不存在',
          available: Object.getOwnPropertyNames(DayTimeGround || {})
        });
      }
      
      const timeGround = DayTimeGround.getByName(hour);
      console.log('時辰轉換成功:', timeGround);
      
      const genderEnum = (gender === 'F' || gender === 'female' || gender === '女') ? Gender.F : Gender.M;
      
      const config = DestinyConfigBuilder.withSolar({
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
        bornTimeGround: timeGround,
        configType: ConfigType.SKY,
        gender: genderEnum
      });
      
      const destinyBoard = new DestinyBoard(config);
      
      res.json({
        success: true,
        data: destinyBoard
      });
      
    } catch (e) {
      console.error('排盤錯誤:', e);
      res.status(500).json({ 
        error: '排盤錯誤', 
        message: e.message,
        stack: e.stack
      });
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`伺服器啟動: http://0.0.0.0:${port}`);
  });

} catch (e) {
  console.error('套件載入失敗:', e);
  process.exit(1);
}
