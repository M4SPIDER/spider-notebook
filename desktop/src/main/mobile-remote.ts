import type { BrowserWindow } from "electron"
import * as fs from "node:fs"
import * as path from "node:path"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)

function getSavedWorkspace(): { name: string; dir: string } | null {
  try {
    const appData = process.env.APPDATA || ""
    const appDirs = ["ai.m4spider.desktop", "ai.m4spider.desktop.dev", "ai.m4spidernotebook", "ai.opencode.desktop"]
    for (const dir of appDirs) {
      const p = path.join(appData, dir, "opencode.global.dat")
      if (fs.existsSync(p)) {
        try {
          const raw = JSON.parse(fs.readFileSync(p, "utf8"))
          if (raw.server) {
            const s = typeof raw.server === "string" ? JSON.parse(raw.server) : raw.server
            const last = s?.lastProject?.local || s?.projects?.local?.[0]?.worktree
            if (last && fs.existsSync(last)) {
              return { name: path.basename(last) || "spider-notebook", dir: last }
            }
          }
          if (raw.tabs) {
            const tabs = typeof raw.tabs === "string" ? JSON.parse(raw.tabs) : raw.tabs
            if (Array.isArray(tabs)) {
              for (const t of tabs) {
                if (t?.directory && fs.existsSync(t.directory)) {
                  return { name: path.basename(t.directory) || "spider-notebook", dir: t.directory }
                }
                if (t?.dirBase64) {
                  try {
                    const dec = Buffer.from(t.dirBase64, "base64").toString("utf8")
                    if (dec && fs.existsSync(dec)) {
                      return { name: path.basename(dec) || "spider-notebook", dir: dec }
                    }
                  } catch {}
                }
              }
            }
          }
        } catch {}
      }
    }
  } catch {}
  return null
}

function getAllSavedProjects(): Array<{ name: string; dir: string }> {
  const result: Array<{ name: string; dir: string }> = []
  const seen = new Set<string>()
  try {
    const appData = process.env.APPDATA || ""
    const appDirs = ["ai.m4spider.desktop", "ai.m4spider.desktop.dev", "ai.m4spidernotebook", "ai.opencode.desktop"]
    for (const dir of appDirs) {
      const p = path.join(appData, dir, "opencode.global.dat")
      if (fs.existsSync(p)) {
        try {
          const raw = JSON.parse(fs.readFileSync(p, "utf8"))
          if (raw.server) {
            const s = typeof raw.server === "string" ? JSON.parse(raw.server) : raw.server
            const list = s?.projects?.local || []
            for (const item of list) {
              const wt = item?.worktree
              if (wt && fs.existsSync(wt) && !seen.has(wt)) {
                seen.add(wt)
                result.push({ name: path.basename(wt), dir: wt })
              }
            }
          }
          if (raw.tabs) {
            const tabs = typeof raw.tabs === "string" ? JSON.parse(raw.tabs) : raw.tabs
            if (Array.isArray(tabs)) {
              for (const t of tabs) {
                const d = t?.directory
                if (d && fs.existsSync(d) && !seen.has(d)) {
                  seen.add(d)
                  result.push({ name: path.basename(d), dir: d })
                }
                if (t?.dirBase64) {
                  try {
                    const dec = Buffer.from(t.dirBase64, "base64").toString("utf8")
                    if (dec && fs.existsSync(dec)) {
                      seen.add(dec)
                      result.push({ name: path.basename(dec), dir: dec })
                    }
                  } catch {}
                }
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  const defaults = [
    "C:/Users/vvvr8/Downloads/game engine",
    "C:/Users/vvvr8/Downloads/spider-notebook-3.0.1-source",
    "C:/Users/vvvr8/Downloads/packages/packages",
    "C:/Users/vvvr8/Downloads/google",
  ]
  for (const def of defaults) {
    if (fs.existsSync(def) && !seen.has(def)) {
      seen.add(def)
      result.push({ name: path.basename(def), dir: def })
    }
  }
  return result
}

function getWorkspaceDir(): string {
  const saved = getSavedWorkspace()
  if (saved && saved.dir) return saved.dir

  const candidates = [
    "C:/Users/vvvr8/Downloads/game engine",
    "C:/Users/vvvr8/Downloads/spider-notebook-3.0.1-source",
    "C:/Users/vvvr8/Downloads/packages/packages",
    process.cwd(),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir
    }
  }
  return candidates[0] || process.cwd()
}

function getMobileWebDir(): string {
  const candidates = [
    path.join(process.resourcesPath || "", "mobile-web"),
    path.join(process.resourcesPath || "", "resources/mobile-web"),
    path.join(__dirname, "../../resources/mobile-web"),
    path.join(__dirname, "../resources/mobile-web"),
    path.normalize("C:/Users/vvvr8/Downloads/packages/packages/desktop/resources/mobile-web"),
    path.normalize("C:/Users/vvvr8/Downloads/spider-notebook-3.0.1-source/desktop/resources/mobile-web"),
    path.normalize("C:/Users/vvvr8/Downloads/spider-ai-main/spider-ai-main/dist"),
  ]
  for (const dir of candidates) {
    const norm = path.normalize(dir)
    if (fs.existsSync(norm) && fs.existsSync(path.join(norm, "index.html"))) {
      return norm
    }
  }
  return path.normalize("C:/Users/vvvr8/Downloads/spider-ai-main/spider-ai-main/dist")
}

const MIME_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
}

// In-memory conversation state for Spider Mobile client
let mobileChatStore: {
  revision: number
  host_user: { uid: string; displayName: string; email: string; isAnonymous: boolean }
  active_chat_id: string
  project_name: string
  project_dir: string
  chats: Array<{ id: string; title: string; createdAt: number; messages: any[] }>
} = {
  project_name: (getSavedWorkspace()?.name || "game engine"),
  project_dir: (getSavedWorkspace()?.dir || ""),
  revision: 1,
  host_user: {
    uid: "m4_spider_user",
    displayName: "spider_m4",
    email: "thenwho130@gmail.com",
    isAnonymous: false,
  },
  active_chat_id: "chat_main",
  chats: [
    {
      id: "chat_main",
      title: "M4 Spider Notebook Session",
      createdAt: Date.now(),
      messages: [
        {
          id: "msg_init",
          sender: "ai",
          text: "Connected to **M4 Spider Notebook**.\\n\\nSpider UI loaded with full settings, themes, code blocks, shell execution, and grep search.",
          timestamp: Date.now(),
        },
      ],
    },
  ],
}

export async function setupMobileRemoteRoutes(req: any, res: any, mainWin: BrowserWindow | null): Promise<boolean> {
  const parsedUrl = new URL(req.url || "/", "http://127.0.0.1:4098")
  const pathname = parsedUrl.pathname
  const method = req.method || "GET"

  // 1. Spider AI Remote Pair API
  if (pathname === "/api/remote/pair") {
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify({
      status: "paired",
      device_name: "M4 Spider Desktop",
      client_id: "client_" + Date.now(),
    }))
    return true
  }

  // 2. Spider AI Remote Info API
  if (pathname === "/api/remote/info") {
    const saved = getSavedWorkspace()
    const cwd = saved?.dir || getWorkspaceDir()
    const folderName = saved?.name || path.basename(cwd) || "game engine"

    if (mainWin && !mainWin.isDestroyed()) {
      try {
        const liveInfo = await mainWin.webContents.executeJavaScript(`
          (function() {
            try {
              if (window.__spiderDesktopBridge__) {
                return window.__spiderDesktopBridge__.getProjectInfo();
              }
              const d = document.documentElement.getAttribute('data-active-directory');
              const n = document.documentElement.getAttribute('data-active-project-name');
              if (n || d) return { name: n || '', dir: d || '' };
            } catch(e) {}
            return null;
          })()
        `);
        if (liveInfo) {
          if (liveInfo.name && liveInfo.name !== "spider-notebook") {
            mobileChatStore.project_name = liveInfo.name;
          }
          if (liveInfo.dir) {
            mobileChatStore.project_dir = liveInfo.dir;
          }
        }
      } catch (e) {}
    }

    if (!mobileChatStore.project_name || mobileChatStore.project_name === "spider-notebook") {
      mobileChatStore.project_name = folderName;
      mobileChatStore.project_dir = cwd;
    }

    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify({
      status: "active",
      device_name: "M4 Spider Notebook (Desktop)",
      project_name: mobileChatStore.project_name,
      project_dir: mobileChatStore.project_dir || cwd,
      active: true,
      port: 4098,
      pin: "SPIDER-8492",
    }))
    return true
  }

  // 3. Spider AI Remote Heartbeat API
  if (pathname === "/api/remote/heartbeat") {
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify({ status: "ok", alive: true }))
    return true
  }

  // 3b. Spider AI Remote Toggle
  if (pathname === "/api/remote/toggle") {
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify({ enabled: true, active: true }))
    return true
  }

  // 4. Spider AI Remote Chats GET (Real-time sync with desktop project & session)
  if (pathname === "/api/remote/chats" && method === "GET") {
    const saved = getSavedWorkspace()
    const cwd = saved?.dir || getWorkspaceDir()
    const folderName = saved?.name || path.basename(cwd) || "game engine"

    if (mainWin && !mainWin.isDestroyed()) {
      try {
        const desktopData = await mainWin.webContents.executeJavaScript(`
          (function() {
            try {
              let info = null;
              let msgs = [];
              if (window.__spiderDesktopBridge__) {
                info = window.__spiderDesktopBridge__.getProjectInfo();
                msgs = window.__spiderDesktopBridge__.getMessages();
              }

              if (!info || !info.name || info.name === 'spider-notebook') {
                const d = document.documentElement.getAttribute('data-active-directory') || '';
                const n = document.documentElement.getAttribute('data-active-project-name') || '';
                if (n) info = { name: n, dir: d };
              }

              if (!msgs || msgs.length === 0) {
                const parts = document.querySelectorAll('[data-component="user-message"], [data-component="text-part"], [data-component="reasoning-part"], [data-slot="diagnostic"]');
                msgs = [];
                parts.forEach((el, idx) => {
                  const comp = el.getAttribute('data-component');
                  const isUser = comp === 'user-message';
                  const isReasoning = comp === 'reasoning-part';
                  const isDiag = el.getAttribute('data-slot') === 'diagnostic';
                  const text = (el.textContent || el.innerText || '').trim();
                  if (text) {
                    msgs.push({
                      id: 'desktop_msg_' + idx,
                      role: isUser ? 'user' : 'assistant',
                      sender: isUser ? 'user' : 'ai',
                      content: text,
                      text: text,
                      isReasoning: isReasoning,
                      isError: isDiag,
                      ts: Date.now()
                    });
                  }
                });
              }

              let user = null;
              if (window.api?.auth?.getUser) {
                user = window.api.auth.getUser();
              }

              return { info, msgs, user };
            } catch (err) {
              return null;
            }
          })()
        `);

        if (desktopData) {
          if (desktopData.info && desktopData.info.name && desktopData.info.name !== "spider-notebook") {
            mobileChatStore.project_name = desktopData.info.name;
            mobileChatStore.project_dir = desktopData.info.dir || cwd;
            mobileChatStore.chats[0].title = desktopData.info.name;
          }
          if (desktopData.user && desktopData.user.email) {
            mobileChatStore.host_user.displayName = desktopData.user.name || desktopData.user.displayName || "spider_m4";
            mobileChatStore.host_user.email = desktopData.user.email || "thenwho130@gmail.com";
          }
          if (Array.isArray(desktopData.msgs) && desktopData.msgs.length > 0) {
            mobileChatStore.chats[0].messages = desktopData.msgs;
            mobileChatStore.revision++;
          }
        }
      } catch (e) {}
    }

    if (!mobileChatStore.project_name || mobileChatStore.project_name === "spider-notebook") {
      mobileChatStore.project_name = folderName;
      mobileChatStore.project_dir = cwd;
      mobileChatStore.chats[0].title = folderName;
    }

    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify(mobileChatStore))
    return true
  }

  // 4b. List all available PC projects for mobile client
  if (pathname === "/api/remote/projects" && method === "GET") {
    const list = getAllSavedProjects()
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify({
      active: {
        name: mobileChatStore.project_name,
        dir: mobileChatStore.project_dir,
      },
      projects: list,
    }))
    return true
  }

  // 4c. Switch active project from mobile client
  if (pathname === "/api/remote/projects/switch" && method === "POST") {
    let body = ""
    for await (const chunk of req) body += chunk
    try {
      const data = JSON.parse(body)
      const targetDir = data.directory || data.dir || ""
      if (targetDir && fs.existsSync(targetDir)) {
        const targetName = path.basename(targetDir)
        mobileChatStore.project_name = targetName
        mobileChatStore.project_dir = targetDir
        mobileChatStore.chats[0].title = targetName

        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.webContents.send("deep-link", [targetDir])
          const slug = Buffer.from(targetDir).toString("base64")
          await mainWin.webContents.executeJavaScript(`
            (function() {
              try {
                window.location.hash = '/${slug}/session';
                window.dispatchEvent(new CustomEvent('spider-open-project', { detail: ${JSON.stringify(targetDir)} }));
              } catch(e) {}
            })()
          `)
        }
        res.setHeader("Content-Type", "application/json")
        res.writeHead(200)
        res.end(JSON.stringify({ status: "success", project_name: targetName, project_dir: targetDir }))
        return true
      }
      res.setHeader("Content-Type", "application/json")
      res.writeHead(400)
      res.end(JSON.stringify({ error: "Directory not found on host PC" }))
    } catch (e) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(400)
      res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  // 5. Spider AI Remote Chats PUSH
  if (pathname === "/api/remote/chats/push" && method === "POST") {
    let body = ""
    for await (const chunk of req) body += chunk
    try {
      const data = JSON.parse(body)
      if (Array.isArray(data.chats)) {
        mobileChatStore.chats = data.chats
      }
      if (data.active_chat_id) {
        mobileChatStore.active_chat_id = data.active_chat_id
      }
      mobileChatStore.revision++

      // Forward latest user message to desktop window
      const activeChat = mobileChatStore.chats.find((c: any) => c.id === mobileChatStore.active_chat_id)
      const lastMsg = activeChat?.messages?.[activeChat.messages.length - 1]
      if (lastMsg && (lastMsg.sender === "user" || lastMsg.role === "user") && mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("remote-prompt", lastMsg.text || "")
        try {
          await mainWin.webContents.executeJavaScript(`
            (function(text) {
              try {
                const editor = document.querySelector('[contenteditable="true"]');
                if (editor) {
                  editor.focus();
                  document.execCommand('insertText', false, text);
                  const submitBtn = document.querySelector('button[data-action="prompt-submit"], form button[type="submit"]');
                  if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                  }
                }
              } catch (e) {}
            })(${JSON.stringify(lastMsg.text || "")})
          `)
        } catch {}
      }

      res.setHeader("Content-Type", "application/json")
      res.writeHead(200)
      res.end(JSON.stringify({ status: "success", revision: mobileChatStore.revision }))
    } catch (e: any) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(400)
      res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  // 6. Screenshot API
  if (pathname.startsWith("/api/screenshot") && method === "GET") {
    if (!mainWin || mainWin.isDestroyed()) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(503)
      res.end(JSON.stringify({ error: "No desktop window available" }))
      return true
    }
    try {
      const image = await mainWin.webContents.capturePage()
      res.setHeader("Content-Type", "application/json")
      res.writeHead(200)
      res.end(JSON.stringify({ image: image.toDataURL() }))
    } catch (e: any) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(500)
      res.end(JSON.stringify({ error: e.message }))
    }
    return true
  }

  // 7. Shell API
  if (pathname === "/api/shell" && method === "POST") {
    let body = ""
    for await (const chunk of req) body += chunk
    try {
      const { command } = JSON.parse(body)
      if (!command) {
        res.setHeader("Content-Type", "application/json")
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Missing command" }))
        return true
      }

      const cwd = getWorkspaceDir()
      const start = Date.now()
      let stdout = ""
      let stderr = ""
      let exitCode = 0

      try {
        const result = await execAsync(command, { cwd, maxBuffer: 10 * 1024 * 1024, timeout: 30000 })
        stdout = result.stdout
        stderr = result.stderr
      } catch (err: any) {
        stdout = err.stdout || ""
        stderr = err.stderr || err.message || ""
        exitCode = err.code || 1
      }

      const durationMs = Date.now() - start
      res.setHeader("Content-Type", "application/json")
      res.writeHead(200)
      res.end(JSON.stringify({ stdout, stderr, exitCode, durationMs }))
    } catch (err: any) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
    return true
  }

  // 8. Grep API
  if (pathname === "/api/grep" && method === "POST") {
    let body = ""
    for await (const chunk of req) body += chunk
    try {
      const { query } = JSON.parse(body)
      if (!query) {
        res.setHeader("Content-Type", "application/json")
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Missing query" }))
        return true
      }

      const cwd = getWorkspaceDir()
      const escapedQuery = query.replace(/"/g, '\\"')
      let rawOutput = ""

      try {
        const gitResult = await execAsync(`git grep -n -I -i "${escapedQuery}"`, { cwd, maxBuffer: 10 * 1024 * 1024, timeout: 15000 })
        rawOutput = gitResult.stdout
      } catch (e: any) {
        if (e.stdout) rawOutput = e.stdout
      }

      const matches: Array<{ file: string; line: number; text: string }> = []
      const lines = rawOutput.split(/\r?\n/)

      for (const line of lines) {
        if (!line.trim()) continue
        const colonIdx = line.indexOf(":")
        if (colonIdx > 0) {
          const secondColon = line.indexOf(":", colonIdx + 1)
          if (secondColon > 0) {
            const file = line.substring(0, colonIdx)
            const lineNum = parseInt(line.substring(colonIdx + 1, secondColon), 10)
            const text = line.substring(secondColon + 1).trim()
            if (!isNaN(lineNum)) {
              matches.push({ file, line: lineNum, text })
              if (matches.length >= 200) break
            }
          }
        }
      }

      res.setHeader("Content-Type", "application/json")
      res.writeHead(200)
      res.end(JSON.stringify({ query, total: matches.length, matches }))
    } catch (err: any) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
    return true
  }

  // 9. Prompt API
  if (pathname === "/api/prompt" && method === "POST") {
    let body = ""
    for await (const chunk of req) body += chunk
    try {
      const parsed = JSON.parse(body)
      const prompt = (parsed.prompt || "").trim()

      if (prompt) {
        const activeChat = mobileChatStore.chats.find((c: any) => c.id === mobileChatStore.active_chat_id) || mobileChatStore.chats[0]
        activeChat.messages.push({
          id: "msg_user_" + Date.now(),
          role: "user",
          sender: "user",
          content: prompt,
          text: prompt,
          ts: Date.now(),
          timestamp: Date.now(),
        })
        mobileChatStore.revision++
      }

      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("remote-prompt", prompt)
        try {
          await mainWin.webContents.executeJavaScript(`
            (function(text) {
              try {
                if (window.__spiderDesktopBridge__) {
                  const ok = window.__spiderDesktopBridge__.submitPrompt(text);
                  return { success: ok, bridge: true };
                }
                window.dispatchEvent(new CustomEvent('spider-remote-prompt', { detail: text }));
                const editor = document.querySelector('[contenteditable="true"]');
                if (editor) {
                  editor.textContent = text;
                  editor.dispatchEvent(new Event('input', { bubbles: true }));
                  setTimeout(() => {
                    const submitBtn = document.querySelector('button[data-action="prompt-submit"], form button[type="submit"]');
                    if (submitBtn) submitBtn.click();
                  }, 80);
                }
                return { success: true };
              } catch (e) {
                return { success: false, error: e.message };
              }
            })(${JSON.stringify(prompt)})
          `)
        } catch {}
      }

      res.setHeader("Content-Type", "application/json")
      res.writeHead(200)
      res.end(JSON.stringify({
        status: "success",
        received: prompt,
        project_name: mobileChatStore.project_name,
        project_dir: mobileChatStore.project_dir,
        revision: mobileChatStore.revision
      }))
    } catch (err: any) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(400)
      res.end(JSON.stringify({ error: err.message }))
    }
    return true
  }

  // 10. Static File Serving from spider-ai dist (Pure Spider UI as it is)
  if (method === "GET") {
    const webDir = path.normalize(getMobileWebDir())
    let relativePath = pathname === "/" || pathname === "/remote" ? "/index.html" : pathname
    if (relativePath.startsWith("/remote/")) {
      relativePath = relativePath.replace("/remote", "")
    }

    const safePath = path.normalize(path.join(webDir, relativePath))
    if (safePath.startsWith(webDir) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase()
      const contentType = MIME_MAP[ext] || "application/octet-stream"
      res.setHeader("Content-Type", contentType)
      res.writeHead(200)
      fs.createReadStream(safePath).pipe(res)
      return true
    }

    // Single Page App fallback for HTML routes
    const indexPath = path.join(webDir, "index.html")
    if (fs.existsSync(indexPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8")
      res.writeHead(200)
      fs.createReadStream(indexPath).pipe(res)
      return true
    }
  }

  return false
}
