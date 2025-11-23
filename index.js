// ====== Facebook Cookies Message Sender (Render Deploy Ready) ======
// npm install express axios fca-mafiya body-parser

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const login = require("fca-mafiya");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let api = null; // Global API instance

// ---------- LOGIN USING COOKIES ----------
app.post("/login", async (req, res) => {
    try {
        const rawCookies = req.body.cookies;

        if (!rawCookies) {
            return res.json({ status: false, message: "Cookies missing" });
        }

        // Convert to cookie object for fca-mafiya
        let cookieArr = rawCookies.split(";").map(c => c.trim());

        let formatted = cookieArr.map(c => {
            const [key, value] = c.split("=");
            return { key: key.trim(), value: value.trim(), domain: "facebook.com", path: "/" };
        });

        login({ appState: formatted }, (err, fbApi) => {
            if (err) return res.json({ status: false, message: "Invalid Cookies", error: err });

            api = fbApi;
            api.setOptions({
                listenEvents: false,
                selfListen: false,
                logLevel: "silent",
            });

            return res.json({ status: true, message: "Login Successful!" });
        });

    } catch (e) {
        res.json({ status: false, message: "Unexpected error", error: e });
    }
});

// ---------- SEND MESSAGE ----------
app.post("/send", async (req, res) => {
    try {
        if (!api) return res.json({ status: false, message: "Bot not logged in" });

        const threadID = req.body.threadID;
        const message = req.body.message;

        if (!threadID || !message) {
            return res.json({ status: false, message: "Missing threadID or message" });
        }

        api.sendMessage(message, threadID, (err) => {
            if (err) return res.json({ status: false, message: "Failed", error: err });
            return res.json({ status: true, message: "Message Sent!" });
        });

    } catch (e) {
        res.json({ status: false, message: "Send Error", error: e });
    }
});

// ---------- HOME ----------
app.get("/", (req, res) => {
    res.send(`
        <h1>🔥 Facebook Cookies Message Sender (Render Version) 🔥</h1>
        <form method="POST" action="/login">
            <textarea name="cookies" placeholder="Paste Facebook Cookies" style="width:300px;height:120px;"></textarea><br>
            <button type="submit">Login</button>
        </form>
        <hr>
        <form method="POST" action="/send">
            <input name="threadID" placeholder="Thread ID"><br><br>
            <input name="message" placeholder="Message"><br><br>
            <button type="submit">Send Message</button>
        </form>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on PORT " + PORT));
