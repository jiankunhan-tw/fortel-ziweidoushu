const express = require('express');
const { DestinyBoard, DestinyConfigBuilder, DayTimeGround, ConfigType, Gender } = require('./build/main');

const app = express();
app.use(express.json());

app.post('/ziwei', (req, res) => {
  try {
    // 前端要送 {year, month, day, hour, gender}
    // hour 必須是「中文時辰」例如「寅時」「卯時」等
    const { year, month, day, hour, gender } = req.body;
    // 建立 config 物件
    const config = DestinyConfigBuilder.withSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      bornTimeGround: DayTimeGround.getByName(hour), // hour要傳「寅時」這種
      configType: ConfigType.SKY, // 天盤
      gender: gender === 'F' ? Gender.F : Gender.M
    });
    // 產生命盤
    const destinyBoard = new DestinyBoard(config);

    // 回傳命盤完整資料（或可改回傳 destinyBoard.cells / destinyBoard.config）
    res.json(destinyBoard);
  } catch (e) {
    res.status(500).json({ error: '排盤錯誤', message: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Ziwei API running at http://localhost:${port}/ziwei`);
});
