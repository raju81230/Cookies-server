// ==========================
// FB GROUP NAME LOCK (2025)
// By RAJ MISHRA 🔥
// ==========================

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const cookieParser = require("cookie");
const mafia = require("fca-mafiya");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let botRunning = false;
let intervalID = null;
let api = null;

// =========================
// AUTO HTML UI
// =========================
app.get("/", (req, res) => {
    res.send(`
        <html>
        <head>
            <title>FB Group Name Lock by Raj Mishra</title>
            <style>
                body { font-family: Arial; background: #111; color: #fff; padding: 20px; }
                input, textarea { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; }
                button { padding: 10px 20px; background: #00ff99; border: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h2>🔥 FB Group Name Change + Auto Lock (60 Seconds) 🔥</h2>

            <form action="/start" method="POST">
                <label>Enter Cookies (Raw or JSON):</label>
                <textarea name="cookies" rows="5" required></textarea>

                <label>Thread ID (Group ID):</label>
                <input name="threadID" required>

                <label>New Group Name:</label>
                <input name="groupName" required>

                <button type="submit">🚀 START LOCK</button>
            </form>

            <br><br>

            <form action="/stop" method="POST">
                <button type="submit" style="background:red;">🛑 STOP LOCK</button>
            </form>
        </body>
        </html>
    `);
});

// =========================
// PARSE RAW OR JSON COOKIES
// =========================
function convertCookies(input) {
    try {
        if (input.trim().startsWith("[")) {
            return JSON.parse(input);
        }

        let raw = input.split(";").map(x => x.trim());
        return raw.map(c => {
            let [key, ...v] = c.split("=");
            return { key, value: v.join("=") };
        });

    } catch {
        return null;
    }
}

// =========================
// START BOT
// =========================
app.post("/start", async (req, res) => {
    if (botRunning) return res.send("Bot already running!");

    let rawCookies = req.body.cookies;
    let threadID = req.body.threadID;
    let setName = req.body.groupName;

    let cookies = convertCookies(rawCookies);

    if (!cookies) return res.send("Invalid cookies!");

    fs.writeFileSync("appstate.json", JSON.stringify(cookies, null, 2));

    mafia({ appState: cookies }, async (err, fbAPI) => {
        if (err) return res.send("Login Failed: " + err);

        api = fbAPI;
        botRunning = true;

        // RUN EVERY 60 SECONDS
        intervalID = setInterval(async () => {
            try {
                let info = await api.getThreadInfo(threadID);

                if (info.threadName !== setName) {
                    await api.setTitle(setName, threadID);
                }

            } catch (e) {
                console.log("Error:", e);
            }
        }, 60 * 1000);

        res.send("🔥 Group Name Auto-Lock ACTIVATED (Every 60 Seconds)");
    });
});

// =========================
// STOP BOT
// =========================
app.post("/stop", (req, res) => {
    if (!botRunning) return res.send("Bot not running.");

    clearInterval(intervalID);
    botRunning = false;
    api = null;

    res.send("🛑 Bot Stopped Successfully");
});

// =========================
// PORT FOR RENDER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on PORT " + PORT));
