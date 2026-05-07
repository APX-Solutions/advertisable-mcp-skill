#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");

const SERVER_NAME = "advertisable";
const SERVER_URL = "https://api-adbot.advertisable.ai/mcp/";

function runOpenClaw(args) {
  const result = spawnSync("openclaw", args, {
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

  return result;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unwrapServer(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.url || parsed.transport || parsed.headers) return parsed;
  if (parsed[SERVER_NAME]) return parsed[SERVER_NAME];
  if (parsed.server) return parsed.server;
  return null;
}

function main() {
  const shown = runOpenClaw(["mcp", "show", SERVER_NAME, "--json"]);
  if (shown.status !== 0) {
    const fallback = runOpenClaw(["mcp", "list"]);
    const listText = `${fallback.stdout || ""}\n${fallback.stderr || ""}`;
    if (listText.includes(SERVER_NAME)) {
      console.log("Found an OpenClaw MCP entry named `advertisable`, but could not parse detailed JSON.");
      process.exit(0);
    }
    throw new Error("No OpenClaw MCP entry named `advertisable` was found.");
  }

  const parsed = parseJson(shown.stdout);
  const server = unwrapServer(parsed);
  if (!server) {
    console.log("OpenClaw returned data for `advertisable`, but the shape was not recognized.");
    process.exit(0);
  }

  const problems = [];
  if (server.url !== SERVER_URL) problems.push(`expected url ${SERVER_URL}`);
  if (server.transport !== "streamable-http") problems.push("expected transport streamable-http");

  const headers = server.headers || {};
  const auth = headers.Authorization || headers.authorization;
  if (!auth) problems.push("missing Authorization header");
  else if (!/^Bearer\s+\S+/i.test(String(auth))) problems.push("Authorization header is not a Bearer token");

  if (problems.length) {
    console.log("The `advertisable` MCP entry exists, but it may be misconfigured:");
    for (const problem of problems) console.log(`- ${problem}`);
    process.exit(1);
  }

  console.log("OpenClaw MCP entry `advertisable` is configured.");
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
