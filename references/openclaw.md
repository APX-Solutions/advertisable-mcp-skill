# OpenClaw Setup

OpenClaw can register the Advertisable remote MCP server with `openclaw mcp set`.

On first-time setup, ask the user to choose private browser setup, quick chat setup, or manual setup before asking for any key. Do not ask the user to paste a key into chat unless they choose quick chat setup.

## Private Guided Install

For non-technical users, prefer the local browser setup.

Critical rule: this is a live localhost server. The agent must start the script in a long-running/background session and keep it alive until the user submits the key and the browser shows the success page. Do not run it as a one-shot command just to capture `SETUP_URL`; if the process exits, the browser page will go offline and the user cannot submit the key.

The agent should run:

```bash
node scripts/connect-local-ui.js --client openclaw
```

The script prints a line like:

```text
SETUP_URL http://127.0.0.1:48731/
```

Send that URL to the user and say:

```text
Open this link, paste your Advertisable connection key, and click Connect. When the page says setup is done, come back and tell me.
```

While the user is entering the key, keep the script process running. The browser page installs the OpenClaw MCP config after the user submits the key. It then tells the user they can close the tab and tell the agent setup is done. The agent may stop watching the process only after the success page appears, the script exits by itself, or the user cancels.

If the user sees a browser "page offline", "connection refused", or similar localhost error before submitting the key, the setup script was probably stopped too early. Restart it in a persistent session and give the user the new `SETUP_URL`.

Technical fallback:

```bash
node scripts/install-openclaw-mcp.js
```

The script prompts for the Advertisable connection key and does not print it.

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
