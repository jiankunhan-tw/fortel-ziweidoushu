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
  
  // 測試所有時辰名稱
  const timeNames = ['子時', '丑時', '寅時', '卯時', '辰時', '巳時', '午時', '未時', '申時', '酉時', '戌時', '亥時'];
  console.log('測試時辰轉換:');
  timeNames.forEach(timeName => {
    try {
      const result = DayTimeGround.getByName(timeName);
      console.log(`${timeName}: ${result ? '成功' : '失敗'} - ${result}`);
    } catch (e) {
      console.log(`${timeName}: 錯誤 - ${e.message}`);
    }
  });
  
  // 檢查 DayTimeGround 的所有可用方法和屬性
  console.log('DayTimeGround 所有屬性和方法:');
  console.log(Object.getOwnPropertyNames(DayTimeGround));
  
  // 如果有靜態屬性，列出來
  console.log('DayTimeGround 的值:');
  for (let prop in DayTimeGround) {
    console.log(`${prop}: ${DayTimeGround[prop]}`);
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

  // 新增時辰測試路由
  app.get('/test-times', (req, res) => {
    const timeNames = ['子時', '丑時', '寅時', '卯時', '辰時', '巳時', '午時', '未時', '申時', '酉時', '戌時', '亥時'];
    const results = {};
    
    timeNames.forEach(timeName => {
      try {
        const result = DayTimeGround.getByName(timeName);
        results[timeName] = {
          success: result !== null && result !== undefined,
          value: result ? result.toString() : 'null/undefined'
        };
      } catch (e) {
        results[timeName] = {
          success: false,
          error: e.message
        };
      }
    });
    
    res.json({
      timeConversionResults: results,
      dayTimeGroundProperties: Object.getOwnPropertyNames(DayTimeGround),
      dayTimeGroundValues: Object.keys(DayTimeGround).reduce((acc, key) => {
        acc[key] = DayTimeGround[key];
        return acc;
      }, {})
    });
  });

  // 套件檢查
  app.get('/debug', (req, res) => {
    const debug = {
      packageLoaded: true,
      exports: Object.keys(ziwei),
      DestinyBoard: typeof DestinyBoard,
      DestinyConfigBuilder: typeof DestinyConfigBuilder,
      DayTimeGround: typeof DayTimeGround,
      hasGetByName: typeof DayTimeGround?.getByName === 'function',
      dayTimeGroundMethods: DayTimeGround ? Object.getOwnPropertyNames(DayTimeGround) : 'N/A',
      dayTimeGroundStatic: Object.keys(DayTimeGround || {})
    };
    
    res.json(debug);
  });

  // 改進的排盤 API
  app.post('/ziwei', (req, res) => {
    console.log('收到排盤請求:', JSON.stringify(req.body));
    
    try {
      const { year, month, day, hour, gender } = req.body;
      
      if (!year || !month || !day || !hour || !gender) {
        return res.status(400).json({ error: '參數不完整' });
      }
      
      console.log('準備呼叫 DayTimeGround.getByName:', hour);
      
      // 檢查方法是否存在
      if (typeof DayTimeGround?.getByName !== 'function') {
        return res.status(500).json({
          error: '套件錯誤',
          message: 'DayTimeGround.getByName 方法不存在',
          available: Object.getOwnPropertyNames(DayTimeGround || {}),
          staticValues: Object.keys(DayTimeGround || {})
        });
      }
      
      // 嘗試轉換時辰，特殊處理子時
      let timeGround;
      
      // 針對子時的特殊處理 - 先嘗試其他可能的格式
      if (hour === '子時') {
        console.log('檢測到子時，嘗試各種可能的格式...');
        
        const possibleFormats = [
          '子時',  // 原本的格式
          '子',    // 簡化格式
          'zi',    // 拼音小寫
          'ZI',    // 拼音大寫
          '子时',  // 簡體字
          '0',     // 數字格式
          '00'     // 雙位數字
        ];
        
        let formatWorked = false;
        for (let format of possibleFormats) {
          try {
            console.log(`嘗試格式: "${format}"`);
            timeGround = DayTimeGround.getByName(format);
            if (timeGround) {
              console.log(`子時使用格式 "${format}" 成功!`);
              formatWorked = true;
              break;
            }
          } catch (e) {
            console.log(`格式 "${format}" 失敗: ${e.message}`);
            continue;
          }
        }
        
        if (!formatWorked) {
          console.log('所有子時格式都失敗，檢查套件內部可用值...');
          
          // 嘗試直接訪問可能的靜態屬性
          const staticProps = ['ZI', 'zi', '子', 'CHILD', 'child', 'RAT', 'rat'];
          for (let prop of staticProps) {
            if (DayTimeGround[prop]) {
              timeGround = DayTimeGround[prop];
              console.log(`使用靜態屬性 DayTimeGround.${prop} 成功`);
              formatWorked = true;
              break;
            }
          }
        }
        
        if (!formatWorked) {
          // 最後的嘗試：使用文字描述法創建配置
          console.log('嘗試使用 DestinyConfigBuilder.withText 方法...');
          try {
            const textConfig = DestinyConfigBuilder.withText(`公曆${year}年${month}月${day}日子時${gender === 'F' || gender === 'female' || gender === '女' ? '女士' : '男士'}`);
            return res.json({
              success: true,
              data: new DestinyBoard(textConfig),
              debug: {
                method: 'withText',
                inputText: `公曆${year}年${month}月${day}日子時${gender === 'F' || gender === 'female' || gender === '女' ? '女士' : '男士'}`
              }
            });
          } catch (e) {
            console.error('withText 方法也失敗:', e);
          }
        }
        
      } else {
        // 其他時辰正常處理
        try {
          timeGround = DayTimeGround.getByName(hour);
          console.log('時辰轉換結果:', timeGround);
        } catch (e) {
          console.error('時辰轉換錯誤:', e);
          return res.status(400).json({
            error: '時辰轉換失敗',
            message: e.message,
            inputHour: hour,
            suggestion: '請確認時辰格式正確，例如：子時、丑時、寅時等'
          });
        }
      }
      
      // 檢查轉換結果，特別處理子時
      if (!timeGround) {
        console.error('時辰轉換返回 null/undefined');
        
        // 只針對子時的特殊處理
        if (hour === '子時') {
          console.log('檢測到子時問題，嘗試多種格式...');
          
          const alternativeFormats = ['子', 'zi', 'ZI', '子时', '23:00', '00:00'];
          
          for (let format of alternativeFormats) {
            try {
              timeGround = DayTimeGround.getByName(format);
              if (timeGround) {
                console.log(`子時使用格式 "${format}" 成功:`, timeGround);
                break;
              }
            } catch (e) {
              console.log(`子時格式 "${format}" 失敗:`, e.message);
            }
          }
          
          // 如果所有格式都失敗，嘗試手動創建或使用其他方法
          if (!timeGround) {
            console.log('嘗試查看 DayTimeGround 的所有可用值...');
            console.log('DayTimeGround keys:', Object.keys(DayTimeGround));
            console.log('DayTimeGround values:', Object.values(DayTimeGround));
            
            // 嘗試直接使用可能的靜態屬性
            if (DayTimeGround.ZI) {
              timeGround = DayTimeGround.ZI;
              console.log('使用 DayTimeGround.ZI');
            } else if (DayTimeGround['子']) {
              timeGround = DayTimeGround['子'];
              console.log('使用 DayTimeGround["子"]');
            }
          }
        }
        
        if (!timeGround) {
          return res.status(400).json({
            error: '時辰轉換失敗',
            message: `特別是子時無法識別: ${hour}`,
            inputHour: hour,
            debug: {
              dayTimeGroundKeys: Object.keys(DayTimeGround),
              suggestion: '子時可能在此套件中有特殊處理方式'
            }
          });
        }
      }
      
      console.log('最終使用的時辰:', timeGround);
      
      const genderEnum = (gender === 'F' || gender === 'female' || gender === '女') ? Gender.F : Gender.M;
      
      const config = DestinyConfigBuilder.withSolar({
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
        bornTimeGround: timeGround,
        configType: ConfigType.SKY,
        gender: genderEnum
      });
      
      console.log('配置建立成功:', config);
      
      const destinyBoard = new DestinyBoard(config);
      console.log('命盤建立成功');
      
      res.json({
        success: true,
        data: destinyBoard,
        debug: {
          inputHour: hour,
          resolvedTimeGround: timeGround,
          config: config
        }
      });
      
    } catch (e) {
      console.error('排盤錯誤:', e);
      res.status(500).json({ 
        error: '排盤錯誤', 
        message: e.message,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      });
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`伺服器啟動: http://0.0.0.0:${port}`);
    console.log('請先訪問 /test-times 來檢查時辰轉換是否正常');
  });

} catch (e) {
  console.error('套件載入失敗:', e);
  process.exit(1);
}
