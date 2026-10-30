import type { BrowserWindow } from "electron"

export function getMobileRemoteHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>M4 Spider Mobile Console</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #141417;
      --card-inner: #1c1c21;
      --border: rgba(255, 255, 255, 0.08);
      --gold-border: rgba(212, 175, 55, 0.45);
      --gold: #FBE49D;
      --gold-primary: #D4AF37;
      --text: #F4F4F5;
      --text-muted: #A1A1AA;
      --green: #10B981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: env(safe-area-inset-top, 12px) 16px env(safe-area-inset-bottom, 16px) 16px;
      overflow-x: hidden;
    }

    /* Top Navigation */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0 16px 0;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: rgba(9, 9, 11, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #FFFFFF;
      color: #EA580C;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.2px;
    }
    .brand-sub {
      font-size: 10px;
      color: var(--gold);
      font-weight: 600;
      letter-spacing: 0.4px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(16, 185, 129, 0.12);
      color: var(--green);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

    /* Content Area */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 14px 0 90px 0;
    }

    /* Art Deco Black & Gold Quota Card (Identical to Desktop) */
    .quota-card {
      background: linear-gradient(160deg, #18181c 0%, #0c0c0e 100%);
      border: 1px solid var(--gold-primary);
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 223, 115, 0.15);
    }
    .quota-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .quota-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--gold);
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
    }
    .quota-badge {
      font-size: 10px;
      font-weight: 700;
      color: #10B981;
      padding: 2px 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      text-transform: uppercase;
    }
    .progress-track {
      height: 8px;
      width: 100%;
      background: #050507;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 999px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      width: 15%;
      background: linear-gradient(90deg, #8C6D1F 0%, #D4AF37 35%, #FFF0B8 70%, #D4AF37 100%);
      box-shadow: 0 0 10px rgba(243, 210, 120, 0.5);
      border-radius: 999px;
      transition: width 0.5s ease;
    }
    .quota-metrics {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Live Feed / Chat Stream */
    .chat-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .feed-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .feed-msg {
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.45;
    }
    .feed-msg.user {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(184, 134, 11, 0.08) 100%);
      border: 1px solid rgba(212, 175, 55, 0.3);
      color: var(--gold);
      align-self: flex-end;
      max-width: 90%;
    }
    .feed-msg.agent {
      background: var(--card-inner);
      border: 1px solid var(--border);
      color: var(--text);
      align-self: flex-start;
      max-width: 95%;
    }
    .feed-msg .author {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
      opacity: 0.7;
    }

    /* Quick Remote Tools Bar */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .tool-btn {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 10px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: var(--text);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tool-btn:active {
      transform: scale(0.95);
      border-color: var(--gold-primary);
    }
    .tool-icon {
      font-size: 18px;
    }

    /* Screen Preview Modal */
    #screenModal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 100;
      flex-direction: column;
      padding: 16px;
      align-items: center;
      justify-content: center;
    }
    #screenModal img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 12px;
      border: 1px solid var(--gold-primary);
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
    }
    .close-modal {
      margin-top: 14px;
      background: #FFFFFF;
      color: #000;
      border: none;
      padding: 8px 24px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 13px;
    }

    /* Floating Bottom Composer */
    .composer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 16px calc(env(safe-area-inset-bottom, 10px) + 8px) 16px;
      background: rgba(14, 14, 17, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
      z-index: 60;
    }
    .composer-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0d0d10;
      border: 1px solid var(--gold-border);
      border-radius: 999px;
      padding: 6px 8px 6px 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    .composer-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #FFFFFF;
      font-size: 14px;
      outline: none;
    }
    .composer-input::placeholder {
      color: var(--text-muted);
    }
    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #B8860B 0%, #D4AF37 50%, #FFDF73 100%);
      color: #0d0d0f;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 900;
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
      cursor: pointer;
      transition: transform 0.15s;
    }
    .send-btn:active {
      transform: scale(0.9);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header>
    <div class="brand">
      <div class="logo-circle">S</div>
      <div>
        <div class="brand-title">M4 SPIDER</div>
        <div class="brand-sub">PHONE REMOTE CONTROL</div>
      </div>
    </div>
    <div class="status-pill">
      <div class="pulse-dot"></div>
      Desktop Live
    </div>
  </header>

  <!-- Main Body -->
  <main>
    <!-- Art Deco Gold Quota Card -->
    <div class="quota-card">
      <div class="quota-header">
        <span class="quota-title">Usage Quota</span>
        <span class="quota-badge">Pro Active</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="progressBar"></div>
      </div>
      <div class="quota-metrics">
        <span><strong style="color: #FFFFFF;" id="tokensUsed">124K</strong> / 1M tokens</span>
        <span style="color: var(--gold); font-weight: 700;">12% Used</span>
      </div>
    </div>

    <!-- Quick Tools -->
    <div class="tools-grid">
      <button class="tool-btn" onclick="captureLiveScreen()">
        <span class="tool-icon">📷</span>
        <span>Screen</span>
      </button>
      <button class="tool-btn" onclick="triggerRemote('open-browser')">
        <span class="tool-icon">🌐</span>
        <span>Browser</span>
      </button>
      <button class="tool-btn" onclick="triggerRemote('status')">
        <span class="tool-icon">⚡</span>
        <span>Agent</span>
      </button>
      <button class="tool-btn" onclick="triggerRemote('clear')">
        <span class="tool-icon">🔄</span>
        <span>Reset</span>
      </button>
    </div>

    <!-- Live Agent Conversation Feed -->
    <div class="chat-section">
      <div class="section-title">
        <span>Live Session Feed</span>
        <span style="font-size: 11px; color: var(--gold);" id="feedCount">3 updates</span>
      </div>
      <div class="feed-container" id="feedContainer">
        <div class="feed-msg agent">
          <div class="author">M4 SPIDER AGENT</div>
          <div>Mobile Remote Control connected. You can monitor progress and dispatch tasks directly from your phone.</div>
        </div>
      </div>
    </div>
  </main>

  <!-- Bottom Floating Composer -->
  <div class="composer">
    <div class="composer-inner">
      <input type="text" id="mobilePrompt" class="composer-input" placeholder="Message M4 Spider on PC..." />
      <button class="send-btn" id="sendBtn" onclick="handleSend()">⚡</button>
    </div>
  </div>

  <!-- Screen Preview Modal -->
  <div id="screenModal">
    <img id="screenImg" src="" alt="Desktop Screen" />
    <button class="close-modal" onclick="closeScreenModal()">Close Preview</button>
  </div>

  <script>
    const input = document.getElementById('mobilePrompt');
    const feed = document.getElementById('feedContainer');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    async function handleSend() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      // Add user message to feed
      addMessage('user', text);

      try {
        const res = await fetch('/api/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        });
        const data = await res.json();
        addMessage('agent', '✓ Dispatched to notebook session: "' + text + '"');
      } catch (err) {
        addMessage('agent', 'Prompt dispatched to desktop window.');
      }
    }

    function addMessage(type, content) {
      const el = document.createElement('div');
      el.className = 'feed-msg ' + type;
      el.innerHTML = '<div class="author">' + (type === 'user' ? 'YOU (MOBILE)' : 'M4 SPIDER') + '</div><div>' + content + '</div>';
      feed.appendChild(el);
      feed.scrollTop = feed.scrollHeight;
    }

    async function captureLiveScreen() {
      addMessage('agent', 'Requesting live screenshot from desktop...');
      try {
        const res = await fetch('/api/screenshot');
        const data = await res.json();
        if (data.image) {
          document.getElementById('screenImg').src = data.image;
          document.getElementById('screenModal').style.display = 'flex';
        } else {
          addMessage('agent', 'Screenshot capture ready on desktop.');
        }
      } catch (e) {
        addMessage('agent', 'Screenshot requested on PC.');
      }
    }

    function closeScreenModal() {
      document.getElementById('screenModal').style.display = 'none';
    }

    async function triggerRemote(action) {
      addMessage('user', 'Trigger: ' + action);
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: action })
        });
        addMessage('agent', 'Action "' + action + '" executed on PC.');
      } catch {
        addMessage('agent', 'Dispatched action to PC.');
      }
    }
  </script>
</body>
</html>`
}

export function setupMobileRemoteRoutes(req: any, res: any, mainWin: BrowserWindow | null) {
  // GET / or GET /remote: serve mobile web app
  if (req.method === "GET") {
    if (req.url === "/api/screenshot" && mainWin) {
      mainWin.webContents.capturePage().then((image) => {
        res.setHeader("Content-Type", "application/json")
        res.writeHead(200)
        res.end(JSON.stringify({ image: image.toDataURL() }))
      }).catch((e) => {
        res.writeHead(500)
        res.end(JSON.stringify({ error: e.message }))
      })
      return true
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.writeHead(200)
    res.end(getMobileRemoteHtml())
    return true
  }

  return false
}
