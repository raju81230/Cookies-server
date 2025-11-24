const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active sessions
const activeSessions = new Map();
const messageQueues = new Map();

// WebSocket Server
const server = app.listen(PORT, () => {
    console.log(`🚀 RAJ COOKIES SERVER running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('🔗 WebSocket Client Connected');
    ws.send(JSON.stringify({ type: 'status', message: 'WebSocket Connected Successfully', status: 'connected' }));
});

// Broadcast to all WebSocket clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Serve HTML Page
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RAJ COOKIES SERVER</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Arial', sans-serif;
            }
            
            body {
                background: linear-gradient(135deg, #ffffff 0%, #ffe6f2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(255, 105, 180, 0.2);
                overflow: hidden;
                border: 3px solid #ff69b4;
            }
            
            .header {
                background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
                color: white;
                padding: 25px;
                text-align: center;
                border-bottom: 3px solid #ff1493;
            }
            
            .header h1 {
                font-size: 2.5em;
                font-weight: bold;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .header .developer {
                font-size: 1.2em;
                opacity: 0.9;
                font-weight: bold;
            }
            
            .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 25px;
            }
            
            @media (max-width: 768px) {
                .content {
                    grid-template-columns: 1fr;
                }
            }
            
            .form-section, .logs-section {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 12px;
                border: 2px solid #ffb6c1;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: #d63384;
                font-size: 1.1em;
            }
            
            input, textarea, select {
                width: 100%;
                padding: 12px;
                border: 2px solid #ff69b4;
                border-radius: 8px;
                font-size: 1em;
                background: white;
                transition: all 0.3s ease;
            }
            
            input:focus, textarea:focus, select:focus {
                outline: none;
                border-color: #ff1493;
                box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
            }
            
            textarea {
                height: 120px;
                resize: vertical;
                font-family: monospace;
            }
            
            .btn {
                background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                margin: 5px 0;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 105, 180, 0.4);
            }
            
            .btn-stop {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            }
            
            .btn-clear {
                background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
            }
            
            .logs-container {
                background: #1a1a1a;
                color: #00ff00;
                padding: 15px;
                border-radius: 8px;
                height: 400px;
                overflow-y: auto;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                border: 2px solid #333;
            }
            
            .log-entry {
                margin-bottom: 8px;
                padding: 5px;
                border-left: 3px solid #ff69b4;
                padding-left: 10px;
            }
            
            .log-success { color: #00ff00; }
            .log-error { color: #ff4444; }
            .log-warning { color: #ffaa00; }
            .log-info { color: #44aaff; }
            
            .session-list {
                margin-top: 20px;
            }
            
            .session-item {
                background: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 5px solid #ff69b4;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .status-connected {
                color: #00ff00;
                font-weight: bold;
            }
            
            .status-disconnected {
                color: #ff4444;
                font-weight: bold;
            }
            
            .websocket-status {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: bold;
                background: #28a745;
                color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .websocket-status.disconnected {
                background: #dc3545;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌟 RAJ COOKIES SERVER 🌟</h1>
                <div class="developer">DEVELOPER: R4J M1SHR4</div>
            </div>
            
            <div class="content">
                <div class="form-section">
                    <h2>⚙️ Configuration</h2>
                    <form id="botConfig">
                        <div class="form-group">
                            <label>🔐 Facebook Cookies:</label>
                            <textarea id="cookies" placeholder="fr=0rhS117jZtNqb2drl.AWfob3XWOnYUH3kcgjblL2RUkiTOzv74KnqvOXsC7p1ASZWd8q8.BpIHYg..AAA.0.0.BpIHaI.AWd1Chpo4ISAo_F_kQYjaGV7MBg; locale=hi_IN; xs=47%3Ad32xc14WOJp82A%3A2%3A1763735100%3A-1%3A-1; pas=61583935177448%3ARM2BRkdHqY; c_user=61583935177448; ps_n=1; sb=IHYgaRy2otPWD_1ErU87NmJ_; wd=800x1280; ps_l=1; m_pixel_ratio=1.5; datr=IHYgaXp_jCdzcMNFrJ37EI6C;" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>👥 Group UID:</label>
                            <input type="text" id="groupUID" placeholder="Enter Facebook Group UID" required>
                        </div>
                        
                        <div class="form-group">
                            <label>📝 Message Prefix:</label>
                            <input type="text" id="prefix" placeholder="Prefix before each message" value="💬 ">
                        </div>
                        
                        <div class="form-group">
                            <label>⏰ Time Delay (seconds):</label>
                            <input type="number" id="delay" placeholder="Delay between messages" value="10" min="5" required>
                        </div>
                        
                        <div class="form-group">
                            <label>📄 Message File:</label>
                            <input type="file" id="messageFile" accept=".txt" required>
                            <small>Select a .txt file with one message per line</small>
                        </div>
                        
                        <button type="button" class="btn" onclick="startBot()">🚀 START BOT</button>
                        <button type="button" class="btn btn-stop" onclick="stopAllSessions()">🛑 STOP ALL SESSIONS</button>
                        <button type="button" class="btn btn-clear" onclick="clearLogs()">🧹 CLEAR LOGS</button>
                    </form>
                    
                    <div class="session-list" id="sessionList">
                        <h3>📋 Active Sessions</h3>
                        <div id="sessionsContainer"></div>
                    </div>
                </div>
                
                <div class="logs-section">
                    <h2>📊 Live Logs</h2>
                    <div class="websocket-status" id="wsStatus">🔗 WebSocket Connected</div>
                    <div class="logs-container" id="logsContainer">
                        <div class="log-entry log-info">🌟 RAJ COOKIES SERVER Started</div>
                        <div class="log-entry log-info">💡 Ready to configure and start bot</div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let ws;
            let sessions = {};
            
            function connectWebSocket() {
                ws = new WebSocket('ws://localhost:${PORT}');
                
                ws.onopen = function() {
                    document.getElementById('wsStatus').textContent = '🔗 WebSocket Connected';
                    document.getElementById('wsStatus').className = 'websocket-status';
                    addLog('WebSocket connection established', 'success');
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                };
                
                ws.onclose = function() {
                    document.getElementById('wsStatus').textContent = '🔌 WebSocket Disconnected';
                    document.getElementById('wsStatus').className = 'websocket-status disconnected';
                    addLog('WebSocket disconnected', 'error');
                    // Attempt to reconnect after 3 seconds
                    setTimeout(connectWebSocket, 3000);
                };
                
                ws.onerror = function(error) {
                    addLog('WebSocket error: ' + error, 'error');
                };
            }
            
            function handleWebSocketMessage(data) {
                switch(data.type) {
                    case 'status':
                        addLog(data.message, data.status);
                        break;
                    case 'log':
                        addLog(data.message, data.level);
                        break;
                    case 'session_update':
                        updateSessions(data.sessions);
                        break;
                    case 'message_sent':
                        addLog(`✅ Message sent to ${data.groupUID}: ${data.message}`, 'success');
                        break;
                    case 'error':
                        addLog(`❌ Error: ${data.message}`, 'error');
                        break;
                }
            }
            
            function addLog(message, level = 'info') {
                const logsContainer = document.getElementById('logsContainer');
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry log-' + level;
                logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
                logsContainer.appendChild(logEntry);
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
            
            function startBot() {
                const cookies = document.getElementById('cookies').value.trim();
                const groupUID = document.getElementById('groupUID').value.trim();
                const prefix = document.getElementById('prefix').value.trim();
                const delay = parseInt(document.getElementById('delay').value);
                const fileInput = document.getElementById('messageFile');
                
                if (!cookies || !groupUID || !fileInput.files.length) {
                    addLog('❌ Please fill all required fields', 'error');
                    return;
                }
                
                const file = fileInput.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const messages = e.target.result.split('\\n').filter(msg => msg.trim());
                    
                    if (messages.length === 0) {
                        addLog('❌ No messages found in file', 'error');
                        return;
                    }
                    
                    const config = {
                        cookies,
                        groupUID,
                        prefix,
                        delay,
                        messages
                    };
                    
                    fetch('/start', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(config)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            addLog(`✅ Bot started successfully! Session ID: ${data.sessionId}`, 'success');
                        } else {
                            addLog(`❌ Failed to start bot: ${data.error}`, 'error');
                        }
                    })
                    .catch(error => {
                        addLog(`❌ Error starting bot: ${error}`, 'error');
                    });
                };
                
                reader.readAsText(file);
            }
            
            function stopSession(sessionId) {
                fetch('/stop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sessionId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        addLog(`✅ Session ${sessionId} stopped`, 'success');
                    delete sessions[sessionId];
                        updateSessionsDisplay();
                    } else {
                        addLog(`❌ Failed to stop session: ${data.error}`, 'error');
                    }
                });
            }
            
            function stopAllSessions() {
                fetch('/stop-all', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        addLog('✅ All sessions stopped', 'success');
                        sessions = {};
                        updateSessionsDisplay();
                    }
                });
            }
            
            function updateSessions(sessionsData) {
                sessions = sessionsData;
                updateSessionsDisplay();
            }
            
            function updateSessionsDisplay() {
                const container = document.getElementById('sessionsContainer');
                container.innerHTML = '';
                
                if (Object.keys(sessions).length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No active sessions</div>';
                    return;
                }
                
                for (const [sessionId, session] of Object.entries(sessions)) {
                    const sessionDiv = document.createElement('div');
                    sessionDiv.className = 'session-item';
                    sessionDiv.innerHTML = \`
                        <strong>Session ID:</strong> \${sessionId}<br>
                        <strong>Group UID:</strong> \${session.groupUID}<br>
                        <strong>Status:</strong> <span class="\${session.status === 'connected' ? 'status-connected' : 'status-disconnected'}">\${session.status}</span><br>
                        <strong>Messages Sent:</strong> \${session.messagesSent}<br>
                        <button class="btn btn-stop" onclick="stopSession('\${sessionId}')" style="margin-top: 10px; padding: 8px 15px; font-size: 0.9em;">Stop Session</button>
                    \`;
                    container.appendChild(sessionDiv);
                }
            }
            
            function clearLogs() {
                document.getElementById('logsContainer').innerHTML = '';
                addLog('Logs cleared', 'info');
            }
            
            // Initialize WebSocket connection when page loads
            window.onload = function() {
                connectWebSocket();
                // Load initial sessions
                fetch('/sessions')
                    .then(response => response.json())
                    .then(data => {
                        updateSessions(data.sessions);
                    });
            };
        </script>
    </body>
    </html>
    `);
});

// API Routes
app.post('/start', async (req, res) => {
    try {
        const { cookies, groupUID, prefix, delay, messages } = req.body;
        
        const sessionId = 'session_' + Date.now();
        
        // Convert cookies string to appState object
        const appState = parseCookies(cookies);
        
        if (!appState || appState.length === 0) {
            return res.json({ success: false, error: 'Invalid cookies format' });
        }
        
        // Initialize Facebook API
        wiegine({ appState }, (err, api) => {
            if (err) {
                broadcast({ type: 'error', message: `Login failed: ${err.error}` });
                return res.json({ success: false, error: err.error });
            }
            
            broadcast({ 
                type: 'log', 
                message: `✅ Logged in successfully as ${api.getCurrentUserID()}`,
                level: 'success'
            });
            
            const session = {
                api,
                groupUID,
                prefix,
                delay: delay * 1000, // Convert to milliseconds
                messages,
                currentIndex: 0,
                messagesSent: 0,
                status: 'connected',
                intervalId: null
            };
            
            // Start message loop
            session.intervalId = setInterval(() => {
                if (session.currentIndex >= session.messages.length) {
                    session.currentIndex = 0; // Restart from beginning
                }
                
                const message = session.prefix + session.messages[session.currentIndex];
                
                api.sendMessage(message, session.groupUID, (err, messageInfo) => {
                    if (err) {
                        broadcast({
                            type: 'error',
                            message: `Failed to send message: ${err.error}`
                        });
                    } else {
                        session.messagesSent++;
                        broadcast({
                            type: 'message_sent',
                            message: message,
                            groupUID: session.groupUID,
                            count: session.messagesSent
                        });
                        
                        // Update session in storage
                        activeSessions.set(sessionId, session);
                        broadcastSessionsUpdate();
                    }
                });
                
                session.currentIndex++;
                
            }, session.delay);
            
            activeSessions.set(sessionId, session);
            broadcastSessionsUpdate();
            
            broadcast({
                type: 'log',
                message: `🚀 Bot started for group ${groupUID}. Sending messages every ${delay} seconds`,
                level: 'success'
            });
            
            res.json({ success: true, sessionId });
        });
        
    } catch (error) {
        console.error('Error starting bot:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/stop', (req, res) => {
    const { sessionId } = req.body;
    
    if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        clearInterval(session.intervalId);
        activeSessions.delete(sessionId);
        
        broadcast({
            type: 'log',
            message: `🛑 Session ${sessionId} stopped`,
            level: 'warning'
        });
        
        broadcastSessionsUpdate();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Session not found' });
    }
});

app.post('/stop-all', (req, res) => {
    for (const [sessionId, session] of activeSessions) {
        clearInterval(session.intervalId);
    }
    activeSessions.clear();
    
    broadcast({
        type: 'log',
        message: '🛑 All sessions stopped',
        level: 'warning'
    });
    
    broadcastSessionsUpdate();
    res.json({ success: true });
});

app.get('/sessions', (req, res) => {
    const sessions = {};
    for (const [sessionId, session] of activeSessions) {
        sessions[sessionId] = {
            groupUID: session.groupUID,
            status: session.status,
            messagesSent: session.messagesSent,
            delay: session.delay / 1000
        };
    }
    res.json({ sessions });
});

// Helper function to parse cookies string to appState
function parseCookies(cookieString) {
    try {
        const cookies = cookieString.split(';').map(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=');
            const value = valueParts.join('=');
            return {
                key: name,
                value: value,
                domain: '.facebook.com',
                path: '/',
                hostOnly: false,
                creation: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            };
        }).filter(cookie => cookie.key && cookie.value);
        
        return cookies;
    } catch (error) {
        console.error('Error parsing cookies:', error);
        return null;
    }
}

// Broadcast sessions update to all clients
function broadcastSessionsUpdate() {
    const sessions = {};
    for (const [sessionId, session] of activeSessions) {
        sessions[sessionId] = {
            groupUID: session.groupUID,
            status: session.status,
            messagesSent: session.messagesSent,
            delay: session.delay / 1000
        };
    }
    broadcast({ type: 'session_update', sessions });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down RAJ COOKIES SERVER...');
    for (const [sessionId, session] of activeSessions) {
        clearInterval(session.intervalId);
    }
    process.exit(0);
});

console.log(`
🌈 RAJ COOKIES SERVER 🌈
👨‍💻 DEVELOPER: R4J M1SHR4
📍 Server running on http://localhost:${PORT}
🔗 WebSocket server ready
`);
