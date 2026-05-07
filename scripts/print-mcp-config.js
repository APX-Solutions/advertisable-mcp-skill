#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SERVER_NAME = "advertisable";
const SERVER_URL = "https://api-adbot.advertisable.ai/mcp/";

function usage() {
  return [
    "Usage:",
    "  node scripts/print-mcp-config.js",
    "  node scripts/print-mcp-config.js --format json",
    "  node scripts/print-mcp-config.js --format openclaw",
    "  node scripts/print-mcp-config.js --format registry",
    "",
    "Prints Advertisable MCP config snippets with <token> placeholders.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { format: "json", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--format") {
      i += 1;
      if (!argv[i]) throw new Error("--format requires a value");
      args.format = argv[i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function serverConfig() {
  return {
    [SERVER_NAME]: {
      url: SERVER_URL,
      transport: "streamable-http",
      headers: {
        Authorization: "Bearer <token>",
      },
    },
  };
}

function openClawCommand() {
  const config = {
    url: SERVER_URL,
    transport: "streamable-http",
    headers: {
      Authorization: "Bearer <token>",
    },
  };
  return `openclaw mcp set ${SERVER_NAME} '${JSON.stringify(config)}'`;
}

function registryJson() {
  const file = path.join(__dirname, "..", "assets", "server.json");
  return fs.readFileSync(file, "utf8").trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.format === "json") {
    console.log(JSON.stringify(serverConfig(), null, 2));
  } else if (args.format === "openclaw") {
    console.log(openClawCommand());
  } else if (args.format === "registry") {
    console.log(registryJson());
  } else {
    throw new Error(`Unsupported format: ${args.format}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
