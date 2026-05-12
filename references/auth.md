# Auth And API Key Handling

The Advertisable MCP server expects this header on MCP HTTP requests:

```text
Authorization: Bearer <token>
```

The MCP client or gateway should attach this header. Do not pass the API key as an MCP tool argument unless a live tool schema explicitly requires it.

## Setup Choices

Offer user choice. Prefer privacy, but respect convenience.

### Private guided install

Use when the user does not want the agent to see the API key.

For non-technical users, prefer a local browser setup when the client adapter supports it. The agent runs the setup script, sends the user the printed localhost URL, and the user enters the key in their own browser instead of chat.

OpenClaw browser setup:

```bash
node scripts/connect-local-ui.js --client openclaw
```

Tell the user:

```text
Open this link, paste your Advertisable connection key, and click Connect. When the page says setup is done, come back and tell me.
```

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
You can paste the API key here and I will configure it, but it may remain visible in this conversation history. For a more private path, I can give you a local prompt or env-var setup instead.
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
