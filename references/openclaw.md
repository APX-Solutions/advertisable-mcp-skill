# OpenClaw Setup

OpenClaw can register the Advertisable remote MCP server with `openclaw mcp set`.

## Private Guided Install

Run:

```bash
node scripts/install-openclaw-mcp.js
```

The script prompts for the Advertisable API key and does not print it.

Environment-variable setup:

```bash
ADVERTISABLE_API_KEY=<token> node scripts/install-openclaw-mcp.js
```

Token from stdin:

```bash
printf '%s' '<token>' | node scripts/install-openclaw-mcp.js --token-stdin
```

## Agent-Assisted Install

If the user pastes the key into chat and consents to agent-assisted setup, run:

```bash
node scripts/install-openclaw-mcp.js --token <token>
```

Do not repeat the token in visible output.

## Manual Install

Give the user:

```bash
openclaw mcp set advertisable '{"url":"https://api-adbot.advertisable.ai/mcp/","transport":"streamable-http","headers":{"Authorization":"Bearer <the token>"}}'
```

## Restart Requirement

After setup, restart the OpenClaw gateway or start a fresh agent session before expecting the Advertisable tools to appear.

## Verify

Run:

```bash
node scripts/verify-openclaw-mcp.js
```

or:

```bash
openclaw mcp show advertisable --json
openclaw mcp list
```

A successful registry entry means OpenClaw saved the config. It does not prove the remote server accepted the token. If tools are missing, restart first, then troubleshoot.
