#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const readline = require("node:readline");

const SERVER_NAME = "advertisable";
const SERVER_URL = "https://api-adbot.advertisable.ai/mcp/";

function usage() {
  return [
    "Usage:",
    "  node scripts/install-openclaw-mcp.js",
    "  ADVERTISABLE_API_KEY=<token> node scripts/install-openclaw-mcp.js",
    "  node scripts/install-openclaw-mcp.js --token-stdin",
    "  node scripts/install-openclaw-mcp.js --token <token>",
    "  node scripts/install-openclaw-mcp.js --print-config-template",
    "",
    "This script configures OpenClaw without printing the token.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { token: null, tokenStdin: false, printTemplate: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--token-stdin") args.tokenStdin = true;
    else if (arg === "--print-config-template") args.printTemplate = true;
    else if (arg === "--token") {
      i += 1;
      if (!argv[i]) throw new Error("--token requires a value");
      args.token = argv[i];
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

function readAllStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;

    if (!input.isTTY || !output.isTTY) {
      const rl = readline.createInterface({ input, output });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    output.write(question);

    let value = "";
    function onKeypress(str, key) {
      if (key && key.name === "return") {
        output.write("\n");
        input.setRawMode(false);
        input.off("keypress", onKeypress);
        resolve(value);
        return;
      }
      if (key && key.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }
      if (key && key.ctrl && key.name === "c") {
        output.write("\n");
        input.setRawMode(false);
        input.off("keypress", onKeypress);
        process.exit(130);
      }
      if (str) value += str;
    }

    input.on("keypress", onKeypress);
  });
}

function buildConfig(token) {
  return {
    url: SERVER_URL,
    transport: "streamable-http",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function runOpenClaw(config) {
  const result = spawnSync("openclaw", ["mcp", "set", SERVER_NAME, JSON.stringify(config)], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error("The `openclaw` command was not found on PATH.");
    }
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr || `openclaw exited with status ${result.status}`);
  }

  return (result.stdout || "").trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const template = {
    url: SERVER_URL,
    transport: "streamable-http",
    headers: {
      Authorization: "Bearer <token>",
    },
  };

  if (args.printTemplate) {
    console.log(`openclaw mcp set ${SERVER_NAME} '${JSON.stringify(template)}'`);
    return;
  }

  let token = normalizeToken(args.token || process.env.ADVERTISABLE_API_KEY);
  if (!token && args.tokenStdin) {
    token = normalizeToken(await readAllStdin());
  }
  if (!token) {
    token = normalizeToken(await promptHidden("Advertisable API key: "));
  }
  if (!token) {
    throw new Error("No Advertisable API key was provided.");
  }

  const output = runOpenClaw(buildConfig(token));
  if (output) console.log(output);
  console.log("Configured OpenClaw MCP server `advertisable`.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
