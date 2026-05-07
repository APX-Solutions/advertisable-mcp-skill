#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const SERVER_URL = "https://api-adbot.advertisable.ai/mcp/";

function usage() {
  return [
    "Usage:",
    "  ADVERTISABLE_API_KEY=<token> node scripts/generate-tools-reference.js",
    "  node scripts/generate-tools-reference.js --token <token>",
    "  node scripts/generate-tools-reference.js --out references/mcp-tools.md",
    "",
    "Queries the Advertisable MCP server and prints Markdown documentation for tools/list.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { token: null, out: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--token") {
      i += 1;
      if (!argv[i]) throw new Error("--token requires a value");
      args.token = argv[i];
    } else if (arg === "--out") {
      i += 1;
      if (!argv[i]) throw new Error("--out requires a value");
      args.out = argv[i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function normalizeToken(raw) {
  return String(raw || "").trim().replace(/^Bearer\s+/i, "").trim();
}

function decodeResponse(text, contentType) {
  if (contentType.includes("text/event-stream")) {
    const dataLines = text
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);
    if (!dataLines.length) throw new Error("SSE response did not contain data lines.");
    return JSON.parse(dataLines[dataLines.length - 1]);
  }
  return JSON.parse(text);
}

async function rpc(method, params, token, sessionId) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const response = await fetch(SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1_000_000_000),
      method,
      params,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const decoded = decodeResponse(text, contentType);
  if (decoded.error) {
    throw new Error(`${decoded.error.code || "RPC error"}: ${decoded.error.message || "Unknown error"}`);
  }

  return {
    body: decoded.result,
    sessionId: response.headers.get("mcp-session-id") || sessionId || null,
  };
}

function jsonBlock(value) {
  return `\`\`\`json\n${JSON.stringify(value || {}, null, 2)}\n\`\`\``;
}

function renderMarkdown(tools) {
  const lines = [
    "# Advertisable MCP Tools",
    "",
    "Generated from the live MCP `tools/list` response.",
    "",
    "The MCP client should supply this header automatically:",
    "",
    "```text",
    "Authorization: Bearer <token>",
    "```",
    "",
    "## General Tool Use Rules",
    "",
    "- Read each live tool description before calling it.",
    "- Use exact parameter names from the live schema.",
    "- Ask the user before spending budget, publishing ads, modifying campaigns, or taking irreversible external actions.",
    "- Prefer read-only discovery calls before write actions when the task is ambiguous.",
    "- Summarize external changes after write actions with IDs, names, and status.",
    "",
  ];

  for (const tool of tools) {
    lines.push(`## ${tool.name}`);
    lines.push("");
    lines.push(`Purpose: ${tool.description || "No description provided by the server."}`);
    lines.push("");
    lines.push("Input schema:");
    lines.push("");
    lines.push(jsonBlock(tool.inputSchema || tool.input_schema || {}));
    lines.push("");
    if (tool.outputSchema || tool.output_schema) {
      lines.push("Output schema:");
      lines.push("");
      lines.push(jsonBlock(tool.outputSchema || tool.output_schema));
      lines.push("");
    }
    lines.push("Notes:");
    lines.push("");
    lines.push("- Prefer the live schema if this reference becomes stale.");
    lines.push("- Do not include the API key in tool arguments unless the tool schema explicitly requires it.");
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const token = normalizeToken(args.token || process.env.ADVERTISABLE_API_KEY);
  if (!token) throw new Error("Provide an API key via ADVERTISABLE_API_KEY or --token.");

  const initialized = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {
      name: "advertisable-mcp-skill-tool-doc-generator",
      version: "0.1.0",
    },
  }, token, null);

  const listed = await rpc("tools/list", {}, token, initialized.sessionId);
  const tools = Array.isArray(listed.body && listed.body.tools) ? listed.body.tools : [];
  const markdown = renderMarkdown(tools);

  if (args.out) {
    fs.writeFileSync(args.out, markdown, "utf8");
    console.log(`Wrote ${tools.length} tool(s) to ${args.out}`);
  } else {
    process.stdout.write(markdown);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
