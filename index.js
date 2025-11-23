// npm install express body-parser fca-mafiya fs path

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const login = require("fca-mafiya");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ---- GLOBAL TASK ----
let api = null;
let running = false;

// ---- START BOT ----
app.post("/start", async (req, res) => {
    try {
        let cookiesRaw = req.body.cookies.trim();
        let threadID = req.body.groupid.trim();
        let prefix = req.body.prefix.trim();
        let delay = parseInt(req.body.delay.trim()) * 1000;

        // Convert cookies (RAW → JSON)
        let cookies = cookiesRaw.split(";").map(a => {
            let parts = a.trim().split("=");
            return {
                key: parts[0],
                value: parts[1] || "",
                domain: "facebook.com",
                path: "/"
            };
        });

        // Save appstate.json
        fs.writeFileSync("appstate.json", JSON.stringify(cookies, null, 2));

        // LOGIN
        login({ appState: cookies }, (err, fbApi) => {
            if (err) return res.send("Cookies Error ❌");

            api = fbApi;
            running = true;

            res.send("Bot Started Successfully! ✔");

            startLoop(api, threadID, prefix, delay);
        });

    } catch (e) {
        res.send("Server Error ❌");
    }
});

// ---- INFINITE LOOP + AUTO-RECONNECT ----
async function startLoop(api, threadID, prefix, delay) {
    let messages = fs.readFileSync("messages.txt", "utf8").split("\n").filter(Boolean);

    let index = 0;

    while (running) {
        try {
            let msg = `${prefix} ${messages[index]}`;

            api.sendMessage(msg, threadID, (err) => {
                if (err) console.log("Send Error → Reconnecting…");

            });

            console.log("Sent:", msg);

            index = (index + 1) % messages.length;

            await sleep(delay);

        } catch (err) {
            console.log("💀 Error detected → Auto Restarting...");
            await restartSession();
        }
    }
}

// --- Sleep helper ---
function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

// --- AUTO-RECONNECT ---
async function restartSession() {
    return new Promise((resolve) => {
        login({ appState: JSON.parse(fs.readFileSync("appstate.json")) }, (err, fbApi) => {
            if (!err) {
                api = fbApi;
                console.log("🔥 Auto Reconnected");
            }
            resolve();
        });
    });
}

app.listen(3000, () => console.log("Server Running on 3000"));
