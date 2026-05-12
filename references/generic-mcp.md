# Generic MCP Client Setup

Use this reference for any MCP-capable agent client not covered by a dedicated adapter.

## Server Definition

```json
{
  "advertisable": {
    "url": "https://api-adbot.advertisable.ai/mcp/",
    "transport": "streamable-http",
    "headers": {
      "Authorization": "Bearer <token>"
    }
  }
}
```

## Agent Procedure

1. Confirm the client supports remote `streamable-http` MCP servers.
2. Find the client's MCP config command, settings UI, or config file.
3. Prefer the client's secret storage for `Authorization`.
4. Configure the server name as `advertisable`.
5. Restart/reload the MCP client if it loads tools at startup.
6. Confirm the Advertisable tools appear in the live tool list.

For non-technical users, prefer a browser-based private setup if the client adapter provides one. For OpenClaw, use:

```bash
node scripts/connect-local-ui.js --client openclaw
```

Give the user the printed localhost link and tell them to paste their Advertisable connection key there, not in chat.

## Config Snippets

Print a generic snippet:

```bash
node scripts/print-mcp-config.js
```

Print the OpenClaw command template:

```bash
node scripts/print-mcp-config.js --format openclaw
```

Print registry-style metadata:

```bash
node scripts/print-mcp-config.js --format registry
```
