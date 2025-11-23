// npm install express body-parser fca-mafiya uuid ws fs

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const login = require("fca-mafiya");
const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// ------------ SESSION STORE ----------------
let sessions = {};  
// { sessionID: { api, running, threadID, prefix, delay, messages, cookies, ws } }

// ------------ WEBSOCKET SERVER ------------
const wss = new WebSocket.Server({ noServer: true });

function sendWS(sid, text) {
    if (sessions[sid] && sessions[sid].ws && sessions[sid].ws.readyState === 1) {
        sessions[sid].ws.send(text);
    }
}

// ------------ HTML UI ------------
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Non-E2EE Sender Panel</title>
</head>
<body style="font-family:Arial;background:#000;color:#0f0;padding:20px;">

<h2>🔥 Non-E2EE Group Message Sender + LIVE Log 🔥</h2>

<form action="/start" method="post">
    <label>RAW Cookies:</label><br>
    <textarea name="cookies" rows="5" style="width:100%;"></textarea><br><br>

    <label>Group Thread ID:</label><br>
    <input name="groupid" style="width:100%;"><br><br>

    <label>Prefix:</label><br>
    <input name="prefix" style="width:100%;"><br><br>

    <label>Messages (line by line):</label><br>
    <textarea name="messages" rows="5" style="width:100%;"></textarea><br><br>

    <label>Delay (seconds):</label><br>
    <input name="delay" type="number" value="5" style="width:100%;"><br><br>

    <button type="submit" style="padding:10px;width:100%;font-size:18px;">Start</button>
</form>

<hr>
<h3>Session Live Logs</h3>
<input id="sid" placeholder="Session ID" style="width:100%;"><br><br>
<button onclick="connectWS()" style="padding:10px;width:100%;">Connect Logs</button>

<pre id="log" style="background:#111;color:#0f0;padding:10px;height:300px;overflow-y:scroll;"></pre>

<script>
let ws;

function connectWS(){
    let id = document.getElementById("sid").value.trim();
    if(!id) return alert("Enter Session ID");

    ws = new WebSocket("ws://" + location.host + "/ws/" + id);

    ws.onmessage = (msg)=>{
        let log = document.getElementById("log");
        log.textContent += msg.data + "\\n";
        log.scrollTop = log.scrollHeight;
    };
}
</script>

</body>
</html>
    `);
});

// ------------ WEBSOCKET UPGRADE ------------
app.server = app.listen(3000, () => console.log("SERVER RUNNING ON PORT 3000"));

app.server.on("upgrade", (req, socket, head) => {
    const url = req.url.split("/");
    const sid = url[url.length - 1];

    wss.handleUpgrade(req, socket, head, function (ws) {
        sessions[sid] = sessions[sid] || {};
        sessions[sid].ws = ws;

        ws.send("🔗 Connected to Session Log: " + sid);
    });
});


// ------------ START BOT ------------
app.post("/start", (req, res) => {
    try {
        const cookiesRaw = req.body.cookies.trim();
        const threadID = req.body.groupid.trim();
        const prefix = req.body.prefix.trim();
        const delay = parseInt(req.body.delay.trim()) * 1000;
        const messages = req.body.messages.split("\n").map(m => m.trim()).filter(Boolean);

        if (!messages.length) return res.send("❌ No message entered");

        let cookies = cookiesRaw.split(";").map(a => {
            let p = a.trim().split("=");
            return { key: p[0], value: p[1] || "", domain: "facebook.com", path: "/" };
        });

        const sid = uuidv4();
        console.log("SESSION START:", sid);

        login({ appState: cookies }, (err, api) => {
            if (err) return res.send("❌ Cookies Invalid");

            sessions[sid] = {
                api,
                running: true,
                threadID,
                prefix,
                delay,
                messages,
                cookies,
                ws: null
            };

            startLoop(sid);

            res.send(`<h2>Session Started ✔</h2><p><b>SESSION ID:</b> ${sid}</p>`);
        });

    } catch (err) {
        res.send("❌ Server Error");
    }
});

// ------------ MAIN LOOP (INFINITE) ------------
async function startLoop(sid) {
    let s = sessions[sid];
    if (!s) return;

    let i = 0;

    while (sessions[sid] && sessions[sid].running) {
        try {
            let msg = `${s.prefix} ${s.messages[i]}`;

            // TYPING INDICATOR
            s.api.sendTypingIndicator(s.threadID, (err) => { });

            sendWS(sid, `⌛ Typing... (${s.messages[i]})`);

            await sleep(1500);

            s.api.sendMessage(msg, s.threadID, (err, info) => {
                if (err) {
                    sendWS(sid, "❌ ERROR sending message → Reconnect triggered");
                    return;
                }

                sendWS(sid, `✔ SENT: ${msg}`);
            });

            i = (i + 1) % s.messages.length;

            await sleep(s.delay);

        } catch (e) {
            sendWS(sid, "💀 ERROR detected → Auto reconnecting...");
            await reconnect(sid);
        }
    }
}

// ------------ AUTO RECONNECT ------------
async function reconnect(sid) {
    return new Promise((resolve) => {
        let s = sessions[sid];
        if (!s) return resolve();

        login({ appState: s.cookies }, (err, api) => {
            if (!err) {
                s.api = api;
                sendWS(sid, "🔥 Reconnected Successfully");
            }
            resolve();
        });
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
