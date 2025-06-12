const express = require("express");
const { DestinyBoard, DestinyConfigBuilder, DayTimeGround, ConfigType, Gender } = require("fortel-ziweidoushu");

const app = express();
app.use(express.json());

app.post("/api/ziwei", (req, res) => {
    const { year, month, day, hour, gender } = req.body;
    try {
        const destinyBoard = new DestinyBoard(
            DestinyConfigBuilder.withSolar({
                year,
                month,
                day,
                bornTimeGround: DayTimeGround.getByName(hour),
                configType: ConfigType.SKY,
                gender: gender === "男" ? Gender.M : Gender.F,
            })
        );
        res.json(destinyBoard);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/", (req, res) => {
    res.send("Ziwei API ready!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
