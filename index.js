// SERVER.JS — RAW COOKIE SUPPORT + WORKING LOGIN + LOOP + SESSION ENGINE

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");
const login = require("fca-mafiya");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

let sessions = {};
const wss = new WebSocket.Server({ noServer: true });

// RAW COOKIE ➜ JSON appState CONVERTER
function rawToAppState(raw) {
    return raw.split(";").map(c => {
        let [key, ...val] = c.trim().split("=");
        return {
            key: key,
            value: val.join("="),
            domain: "facebook.com",
            path: "/",
            hostOnly: false
        };
    });
}

// WebSocket log function
function sendLog(sessionId, msg) {
    if (sessions[sessionId] && sessions[sessionId].ws) {
        sessions[sessionId].ws.send(JSON.stringify({ log: msg }));
    }
}

// WebSocket upgrade
const server = app.listen(PORT, () =>
    console.log("SERVER RUNNING ON PORT " + PORT)
);

server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        ws.send(JSON.stringify({ log: "WebSocket Connected!" }));
    });
});

// -----------------------------------------------------
// CREATE NEW SESSION
// -----------------------------------------------------
app.post("/create-session", async (req, res) => {
    try {
        let rawCookies = req.body.cookies; // RAW STRING
        let groupId = req.body.group;
        let prefix = req.body.prefix;
        let messageFile = req.body.message;
        let delay = req.body.delay || 10;

        let sessionId = uuidv4();

        sendLog(sessionId, "⏳ Converting Cookies...");

        let appState = rawToAppState(rawCookies);

        sendLog(sessionId, "🍪 Cookie converted ✔");

        login({ appState }, async (err, api) => {
            if (err) {
                sendLog(sessionId, "❌ Login failed");
                return res.json({ error: err.toString() });
            }

            sendLog(sessionId, "🔥 LOGIN SUCCESSFUL!");

            sessions[sessionId] = {
                id: sessionId,
                api,
                groupId,
                prefix,
                messageFile,
                delay,
                running: true,
                ws: null
            };

            loopSend(sessionId);

            res.json({ success: true, sessionId });
        });

    } catch (err) {
        res.json({ error: "Server crashed", detail: err.toString() });
    }
});

// -----------------------------------------------------
// INFINITE LOOP MESSAGE SENDER
// -----------------------------------------------------
async function loopSend(sessionId) {
    let s = sessions[sessionId];
    if (!s) return;

    const api = s.api;

    while (s.running) {
        try {
            sendLog(sessionId, "⌨ Typing...");
            api.sendTypingIndicator(s.groupId);

            let finalMessage = `${s.prefix} ${s.messageFile}`;
            sendLog(sessionId, "📤 Sending → " + finalMessage);

            api.sendMessage(finalMessage, s.groupId, (err) => {
                if (err) sendLog(sessionId, "❌ ERROR: " + err.toString());
                else sendLog(sessionId, "✅ Message Sent!");
            });

            await new Promise(r => setTimeout(r, s.delay * 1000));

        } catch (e) {
            sendLog(sessionId, "❌ Loop crashed: " + e);
        }
    }
}

// STOP SESSION
app.post("/stop-session", (req, res) => {
    let id = req.body.sessionId;
    if (sessions[id]) sessions[id].running = false;
    res.json({ success: true });
});

// DELETE SESSION
app.post("/delete-session", (req, res) => {
    let id = req.body.sessionId;
    if (sessions[id]) delete sessions[id];
    res.json({ success: true });
});
