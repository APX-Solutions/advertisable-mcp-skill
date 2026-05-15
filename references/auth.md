# Auth And API Key Handling

The Advertisable MCP server expects this header on MCP HTTP requests:

```text
Authorization: Bearer <token>
```

The MCP client or gateway should attach this header. Do not pass the API key as an MCP tool argument unless a live tool schema explicitly requires it.

## Setup Choices

On first-time setup, always ask the user which setup path they want before requesting or accepting any Advertisable connection key. Do not default to asking the user to paste the key into chat.

Use this wording:

```text
How would you like to connect Advertisable?

1. Private browser setup: I give you a local link where you enter the key. The key is not pasted into chat.
2. Quick chat setup: you paste the key here and I configure it for you.
3. Manual setup: I show you the command/config and you run it yourself.
```

Respect the user's choice.

### Private guided install

Use when the user does not want the agent to see the API key.

For non-technical users, prefer a local browser setup when the client adapter supports it. The agent runs the setup script, keeps that process alive, sends the user the printed localhost URL, and the user enters the key in their own browser instead of chat.

Critical process rule: the localhost page only works while the setup script is still running. The agent must run the script in a persistent/background session and keep it alive until the user submits the key and sees the success page. Do not run it as a short command just to copy the URL; that will make the browser page go offline.

OpenClaw browser setup:

```bash
node scripts/connect-local-ui.js --client openclaw
```

Tell the user:

```text
Open this link, paste your Advertisable connection key, and click Connect. When the page says setup is done, come back and tell me.
```

While waiting for the user, keep the script process running. Stop it only after the success page appears, the script exits by itself, or the user cancels. If the user reports a browser "page offline" or "connection refused" error, restart the setup script in a persistent session and send the new `SETUP_URL`.

Fallback paths:

- Ask the user to run a local installer that prompts for the key.
- Ask the user to set `ADVERTISABLE_API_KEY` in their shell and run the installer.
- Ask the user to paste the key into a client-provided secret field.
- Provide a manual config snippet with `<token>` placeholders.

Do not ask the user to paste the key into chat in this mode.

### Agent-assisted install

Use when the user explicitly chooses speed and is comfortable sharing the API key in chat.

Before accepting the key, briefly say:

```text
You can paste the Advertisable connection key here and I will configure it, but it may remain visible in this conversation history. For a more private path, choose the browser setup instead.
```

After receiving the key:

- Do not print it back.
- Do not summarize it.
- Do not store it outside the MCP configuration the user asked you to create.
- Prefer direct process arguments or bundled scripts over shell-string interpolation.

### Manual install

Use when the user wants to run the setup themselves.

Give a placeholder config or command and tell the user to replace `<token>` locally.

## Token Normalization

If the user provides a token beginning with `Bearer `, do not produce `Bearer Bearer ...`. Strip a leading `Bearer ` and add exactly one prefix in the MCP header.

## Credential Storage

This skill does not define a global credential store. Each client decides where it stores MCP configuration and headers. If a client supports secret references, prefer them. If a client stores literal headers, warn the user once and continue when they consent.
