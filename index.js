const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const readline = require("readline-sync");
const { v4: uuidv4 } = require("uuid");

// RANDOM DELAY FUNCTION
function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function sendMessage(cookies, threadID, message) {
    try {
        const jar = new CookieJar();

        // Load cookies into jar
        cookies.split(";").forEach(c => {
            jar.setCookieSync(c.trim(), "https://www.facebook.com");
            jar.setCookieSync(c.trim(), "https://m.facebook.com");
        });

        const client = axios.create({
            baseURL: "https://www.facebook.com",
            jar,
            withCredentials: true,
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
            },
            validateStatus: () => true
        });

        // STEP 1 - Extract fb_dtsg + jazoest
        const home = await client.get("/messages/t/");
        const fb_dtsg = home.data.match(/"token":"(.*?)"/)?.[1];
        const jazoest = home.data.match(/"jazoest":"(\d+)"/)?.[1];

        if (!fb_dtsg || !jazoest) {
            console.log("❌ fb_dtsg/jazoest nahi mila → Cookies galat hain.");
            return false;
        }

        // STEP 2 — Real Messenger client_id
        const clientID = Math.floor(Math.random() * 9999999999);

        // STEP 3 — Build message body
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

        // STEP 4 — SEND REQUEST
        const res = await client.post("/messaging/send/", data.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });

        if (res.status === 200) {
            console.log("✅ Message Sent Successfully!");
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
    console.clear();
    console.log("🔥 FB NON-E2EE MESSAGE SENDER (COOKIES → 100% Working) 🔥");

    const cookies = readline.question("\n👉 Cookies Enter Karo: ");
    const threadID = readline.question("👉 Thread ID Enter Karo: ");
    const messageFileOrText = readline.question("👉 Message Enter Karo (Single Line): ");

    console.log("\n🚀 Bot Started...\n");

    while (true) {
        const ok = await sendMessage(cookies, threadID, messageFileOrText);

        if (!ok) {
            console.log("⚠ Retry after 5 sec...");
            await delay(5000);
            continue;
        }

        // RANDOM DELAY 3–8 seconds (natural behaviour)
        const wait = Math.floor(Math.random() * 5000) + 3000;
        console.log(`⏳ Waiting ${wait / 1000} sec...\n`);
        await delay(wait);
    }
}

startBot();
