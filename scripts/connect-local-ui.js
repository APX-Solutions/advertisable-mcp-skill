#!/usr/bin/env node
"use strict";

const http = require("node:http");
const { spawnSync } = require("node:child_process");

const SERVER_NAME = "advertisable";
const MCP_URL = "https://api-adbot.advertisable.ai/mcp/";
const HOST = "127.0.0.1";

function usage() {
  return [
    "Usage:",
    "  node scripts/connect-local-ui.js --client openclaw",
    "  node scripts/connect-local-ui.js --client openclaw --port 48731",
    "",
    "Starts a local private setup page for entering the Advertisable connection key.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { client: "openclaw", port: 0, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--client") {
      i += 1;
      if (!argv[i]) throw new Error("--client requires a value");
      args.client = argv[i].toLowerCase();
    } else if (arg === "--port") {
      i += 1;
      const port = Number(argv[i]);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("--port requires a valid TCP port");
      }
      args.port = port;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function normalizeToken(raw) {
  const token = String(raw || "").trim();
  if (!token) return "";
  return token.replace(/^Bearer\s+/i, "").trim();
}

function htmlPage(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: Canvas;
      color: CanvasText;
    }
    main {
      width: min(92vw, 520px);
      border: 1px solid color-mix(in srgb, CanvasText 18%, Canvas);
      border-radius: 8px;
      padding: 28px;
      box-shadow: 0 12px 34px rgb(0 0 0 / 12%);
    }
    h1 { font-size: 1.45rem; margin: 0 0 12px; }
    p { line-height: 1.5; margin: 0 0 16px; }
    label { display: block; font-weight: 650; margin: 18px 0 8px; }
    input {
      box-sizing: border-box;
      width: 100%;
      font: inherit;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid color-mix(in srgb, CanvasText 25%, Canvas);
      background: Canvas;
      color: CanvasText;
    }
    button {
      margin-top: 18px;
      width: 100%;
      font: inherit;
      font-weight: 700;
      padding: 12px 16px;
      border: 0;
      border-radius: 6px;
      background: #155eef;
      color: white;
      cursor: pointer;
    }
    .note {
      font-size: 0.94rem;
      color: color-mix(in srgb, CanvasText 70%, Canvas);
    }
    .error { color: #b42318; }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formPage(message = "") {
  const messageHtml = message ? `<p class="error">${escapeHtml(message)}</p>` : "";
  return htmlPage("Connect Advertisable", `
    <h1>Connect Advertisable</h1>
    <p>Paste your Advertisable connection key below. This page is running locally on your computer and is only used to configure your agent.</p>
    ${messageHtml}
    <form method="post" action="/connect">
      <label for="key">Advertisable connection key</label>
      <input id="key" name="key" type="password" autocomplete="off" autofocus required>
      <button type="submit">Connect Advertisable</button>
    </form>
    <p class="note">Your key is not shown in chat and is not printed by this setup page.</p>
  `);
}

function successPage() {
  return htmlPage("Advertisable Connected", `
    <h1>Advertisable is connected</h1>
    <p>You can close this tab now.</p>
    <p>Go back to your agent and tell it: <strong>setup is done</strong>.</p>
    <p class="note">Your agent may ask you to restart the gateway or start a fresh session so the new tools appear.</p>
  `);
}

function errorPage(message) {
  return htmlPage("Connection Failed", `
    <h1>Connection failed</h1>
    <p class="error">${escapeHtml(message)}</p>
    <p>You can go back and try again, or ask your agent for help.</p>
  `);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function buildOpenClawConfig(token) {
  return {
    url: MCP_URL,
    transport: "streamable-http",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function installOpenClaw(token) {
  const result = spawnSync("openclaw", ["mcp", "set", SERVER_NAME, JSON.stringify(buildOpenClawConfig(token))], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error("The openclaw command was not found on this computer.");
    }
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error((result.stderr || "").trim() || `openclaw exited with status ${result.status}`);
  }
}

function send(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (args.client !== "openclaw") {
    throw new Error("The local browser setup currently supports --client openclaw only.");
  }

  let server;
  let completed = false;
  const idleTimeout = setTimeout(() => {
    if (!completed) {
      console.log("Setup page timed out without receiving a key.");
      server.close(() => process.exit(0));
    }
  }, 15 * 60 * 1000);

  server = http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/") {
        send(res, 200, formPage());
        return;
      }

      if (req.method === "POST" && req.url === "/connect") {
        const body = await readBody(req);
        const params = new URLSearchParams(body);
        const token = normalizeToken(params.get("key"));
        if (!token) {
          send(res, 400, formPage("Please paste your Advertisable connection key."));
          return;
        }

        installOpenClaw(token);
        completed = true;
        clearTimeout(idleTimeout);
        send(res, 200, successPage());
        console.log("Advertisable is connected. The user can close the browser tab.");
        setTimeout(() => server.close(() => process.exit(0)), 1200);
        return;
      }

      send(res, 404, errorPage("This setup page only supports the connection form."));
    } catch (error) {
      send(res, 500, errorPage(error.message));
      console.error(`Setup failed: ${error.message}`);
    }
  });

  server.listen(args.port, HOST, () => {
    const address = server.address();
    const url = `http://${HOST}:${address.port}/`;
    console.log(`SETUP_URL ${url}`);
    console.log("Send this link to the user. Do not ask them to paste the key into chat.");
    console.log("Keep this process running until the user submits the key and the success page appears.");
  });
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
