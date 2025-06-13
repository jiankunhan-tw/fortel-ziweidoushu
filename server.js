const express = require('express');
// 依你的主程式路徑選擇
const { getZiWeiPan } = require('./src/main'); // 如果主程式不是這個名字請改正

const app = express();
app.use(express.json());

app.post('/ziwei', (req, res) => {
  const { year, month, day, hour, gender } = req.body;
  const result = getZiWeiPan({ year, month, day, hour, gender });
  res.json(result);
});

// Zeabur 會給你 PORT 環境變數，否則預設3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Ziwei API running at http://localhost:${port}/ziwei`);
});
