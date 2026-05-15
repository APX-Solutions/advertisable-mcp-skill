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
    "  node scripts/print-mcp-config.js --format claude-code",
    "  node scripts/print-mcp-config.js --format cursor",
    "  node scripts/print-mcp-config.js --format windsurf",
    "  node scripts/print-mcp-config.js --format vscode",
    "  node scripts/print-mcp-config.js --format continue",
    "  node scripts/print-mcp-config.js --format codex",
    "  node scripts/print-mcp-config.js --format gemini-cli",
    "  node scripts/print-mcp-config.js --format opencode",
    "  node scripts/print-mcp-config.js --format kiro",
    "  node scripts/print-mcp-config.js --format jetbrains-junie",
    "  node scripts/print-mcp-config.js --format zed",
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

function claudeCodeCommand() {
  return `claude mcp add --transport http --header "Authorization: Bearer <token>" --scope user ${SERVER_NAME} ${SERVER_URL}`;
}

function cursorJson() {
  return {
    mcpServers: {
      [SERVER_NAME]: {
        url: SERVER_URL,
        type: "streamable-http",
        headers: {
          Authorization: "Bearer ${env:ADVERTISABLE_API_KEY}",
        },
      },
    },
  };
}

function windsurfJson() {
  return {
    mcpServers: {
      [SERVER_NAME]: {
        serverUrl: SERVER_URL,
        headers: {
          Authorization: "Bearer ${env:ADVERTISABLE_API_KEY}",
        },
      },
    },
  };
}

function vscodeJson() {
  return {
    inputs: [
      {
        type: "promptString",
        id: "advertisable-api-key",
        description: "Advertisable connection key",
        password: true,
      },
    ],
    servers: {
      [SERVER_NAME]: {
        type: "http",
        url: SERVER_URL,
        headers: {
          Authorization: "Bearer ${input:advertisable-api-key}",
        },
      },
    },
  };
}

function continueYaml() {
  return [
    "name: Advertisable MCP",
    "version: 0.0.1",
    "schema: v1",
    "mcpServers:",
    `  - name: ${SERVER_NAME}`,
    "    type: streamable-http",
    `    url: ${SERVER_URL}`,
    "    headers:",
    "      Authorization: Bearer ${env:ADVERTISABLE_API_KEY}",
  ].join("\n");
}

function codexToml() {
  return [
    `[mcp_servers.${SERVER_NAME}]`,
    `url = "${SERVER_URL}"`,
    'bearer_token_env_var = "ADVERTISABLE_API_KEY"',
  ].join("\n");
}

function geminiCliJson() {
  return {
    mcpServers: {
      [SERVER_NAME]: {
        httpUrl: SERVER_URL,
        headers: {
          Authorization: "Bearer ${ADVERTISABLE_API_KEY}",
        },
        trust: false,
      },
    },
  };
}

function opencodeJson() {
  return {
    $schema: "https://opencode.ai/config.json",
    mcp: {
      [SERVER_NAME]: {
        type: "remote",
        url: SERVER_URL,
        headers: {
          Authorization: "Bearer ${env:ADVERTISABLE_API_KEY}",
        },
        enabled: true,
      },
    },
  };
}

function kiroJson() {
  return {
    mcpServers: {
      [SERVER_NAME]: {
        url: SERVER_URL,
        headers: {
          Authorization: "Bearer ${ADVERTISABLE_API_KEY}",
        },
        disabled: false,
      },
    },
  };
}

function jetbrainsJunieJson() {
  return {
    mcpServers: {
      [SERVER_NAME]: {
        url: SERVER_URL,
        headers: {
          Authorization: "Bearer <token>",
        },
      },
    },
  };
}

function zedJson() {
  return {
    context_servers: {
      [SERVER_NAME]: {
        url: SERVER_URL,
        headers: {
          Authorization: "Bearer <token>",
        },
      },
    },
  };
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
  } else if (args.format === "claude-code") {
    console.log(claudeCodeCommand());
  } else if (args.format === "cursor") {
    console.log(JSON.stringify(cursorJson(), null, 2));
  } else if (args.format === "windsurf") {
    console.log(JSON.stringify(windsurfJson(), null, 2));
  } else if (args.format === "vscode") {
    console.log(JSON.stringify(vscodeJson(), null, 2));
  } else if (args.format === "continue") {
    console.log(continueYaml());
  } else if (args.format === "codex") {
    console.log(codexToml());
  } else if (args.format === "gemini-cli") {
    console.log(JSON.stringify(geminiCliJson(), null, 2));
  } else if (args.format === "opencode") {
    console.log(JSON.stringify(opencodeJson(), null, 2));
  } else if (args.format === "kiro") {
    console.log(JSON.stringify(kiroJson(), null, 2));
  } else if (args.format === "jetbrains-junie") {
    console.log(JSON.stringify(jetbrainsJunieJson(), null, 2));
  } else if (args.format === "zed") {
    console.log(JSON.stringify(zedJson(), null, 2));
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
