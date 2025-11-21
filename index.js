const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const fs = require("fs");

// Load config.json
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const cookies = config.cookies;
const threadID = config.threadID;
const messageText = config.message;

// Random delay
function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function sendMessage(cookies, threadID, message) {
    try {
        const jar = new CookieJar();
        cookies.split(";").forEach(c => {
            jar.setCookieSync(c.trim(), "https://www.facebook.com");
            jar.setCookieSync(c.trim(), "https://m.facebook.com");
        });

        const client = axios.create({
            baseURL: "https://www.facebook.com",
            jar,
            withCredentials: true,
            headers: { "User-Agent": "Mozilla/5.0 (Android 10)" },
            validateStatus: () => true
        });

        const home = await client.get("/messages/t/");
        const fb_dtsg = home.data.match(/"token":"(.*?)"/)?.[1];
        const jazoest = home.data.match(/"jazoest":"(\d+)"/)?.[1];

        if (!fb_dtsg || !jazoest) {
            console.log("❌ Cookies invalid.");
            return false;
        }

        const clientID = Math.floor(Math.random() * 9999999999);

        const data = new URLSearchParams();
        data.append("fb_dtsg", fb_dtsg);
        data.append("jazoest", jazoest);
        data.append("body", message);
        data.append("send_type", "SENT");
        data.append("tids", `cid.g.${threadID}`);
        data.append("wwwupp", "C3");
        data.append("client", "mercury");
        data.append("action_type", "ma-type:user-generated-message");
        data.append("timestamp", Date.now());
        data.append("source", "source:chat:web");
        data.append("client_id", clientID);
        data.append("ephemeral_ttl_mode", "0");

        const res = await client.post("/messaging/send/", data.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        if (res.status === 200) {
            console.log("✅ Sent!");
            return true;
        } else {
            console.log("❌ Send failed:", res.status);
            return false;
        }

    } catch (e) {
        console.log("❌ Error:", e.message);
        return false;
    }
}

async function startBot() {
    console.log("🚀 Render Auto Bot Running...\n");

    while (true) {
        const ok = await sendMessage(cookies, threadID, messageText);

        if (!ok) {
            await delay(5000);
            continue;
        }

        const wait = Math.floor(Math.random() * 5000) + 3000;
        console.log(`⏳ Waiting ${wait / 1000} sec...\n`);
        await delay(wait);
    }
}

startBot();
