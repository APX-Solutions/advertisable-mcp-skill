# Claude.ai And Claude Remote Connectors

Use this reference for Claude.ai, Claude Desktop remote connectors, Claude Cowork, and Claude mobile connector setup.

Remote custom connectors are account-level Claude connectors. Claude connects to the remote MCP server from Anthropic's cloud infrastructure, not from the user's local machine.

## Important Fit Check

Advertisable currently expects a bearer token in the HTTP `Authorization` header. If the Claude connector UI does not provide a way to configure that bearer header for a custom remote connector, do not pretend the normal local MCP JSON header flow will work.

In that case, tell the user:

```text
This Claude surface uses remote connectors. If it cannot attach your Advertisable bearer token as an Authorization header, use Claude Code, Cursor, VS Code, Windsurf, Cline, Continue, Codex, or another MCP client that supports remote HTTP headers. A future OAuth connector would make this smoother in Claude.ai.
```

## Setup Flow

1. Ask for the setup path first.
2. If the connector UI supports authenticated custom remote MCP with bearer headers, configure:

```text
Name: Advertisable
URL: https://api-adbot.advertisable.ai/mcp/
Authorization: Bearer <token>
```

3. If it only supports OAuth-style remote connectors, explain that the current Advertisable bearer-token server may need OAuth support or a compatible proxy before this Claude surface can use it.
4. After setup, start a fresh Claude chat and enable the connector/tools if the UI requires it.

## Do Not

- Do not write local `claude_desktop_config.json` instructions for this remote connector flow.
- Do not claim local private network access matters; remote connectors originate from Anthropic cloud infrastructure.
- Do not ask for a token in chat unless the user chose quick chat setup and the target Claude surface can actually use a bearer header.
