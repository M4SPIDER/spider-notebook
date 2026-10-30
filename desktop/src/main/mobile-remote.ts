import type { BrowserWindow } from "electron"
import * as fs from "node:fs"
import * as path from "node:path"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)

function getWorkspaceDir(): string {
  const candidates = [
    "C:/Users/vvvr8/Downloads/spider-notebook-3.0.1-source",
    "C:/Users/vvvr8/Downloads/packages/packages",
    process.cwd(),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, ".git"))) {
      return dir
    }
  }
  return candidates[0] || process.cwd()
}

function getMobileWebDir(): string {
  const candidates = [
    path.join(__dirname, "../../resources/mobile-web"),
    path.join(process.resourcesPath || "", "mobile-web"),
    path.join(process.resourcesPath || "", "resources/mobile-web"),
    path.join(__dirname, "../resources/mobile-web"),
    "C:/Users/vvvr8/Downloads/packages/packages/desktop/resources/mobile-web",
    "C:/Users/vvvr8/Downloads/spider-notebook-3.0.1-source/desktop/resources/mobile-web",
    "C:/Users/vvvr8/Downloads/spider-ai-main/spider-ai-main/dist",
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, "index.html"))) {
      return dir
    }
  }
  return "C:/Users/vvvr8/Downloads/spider-ai-main/spider-ai-main/dist"
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
let mobileChatStore = {
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
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify({
      status: "active",
      device_name: "M4 Spider Notebook (Desktop)",
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

  // 4. Spider AI Remote Chats GET
  if (pathname === "/api/remote/chats" && method === "GET") {
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    res.end(JSON.stringify(mobileChatStore))
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
      const prompt = parsed.prompt || ""

      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send("remote-prompt", prompt)
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
            })(${JSON.stringify(prompt)})
          `)
        } catch {}
      }

      res.setHeader("Content-Type", "application/json")
      res.writeHead(200)
      res.end(JSON.stringify({ status: "success", received: prompt }))
    } catch (err: any) {
      res.setHeader("Content-Type", "application/json")
      res.writeHead(400)
      res.end(JSON.stringify({ error: err.message }))
    }
    return true
  }

  // 10. Static File Serving from spider-ai dist (Pure Spider UI as it is)
  if (method === "GET") {
    const webDir = getMobileWebDir()
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
