# JetBrains AI Assistant And Junie Setup

Use this reference for JetBrains AI Assistant MCP settings and Junie CLI.

JetBrains AI Assistant can connect to remote MCP servers over streamable HTTP using a JSON `mcpServers` config. Junie CLI uses the same MCP JSON structure and can also read `.junie/mcp/mcp.json`.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. For JetBrains AI Assistant, open Settings > Tools > AI Assistant > Model Context Protocol (MCP), then add a remote MCP server JSON config.
3. For Junie CLI, use `/mcp` and the MCP Installation Assistant, or edit `.junie/mcp/mcp.json`.
4. Apply/reconnect the server, or restart the agent session.
5. Review available tools from the MCP status UI or `/mcp`.

## Config

```json
{
  "mcpServers": {
    "advertisable": {
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

If the UI supports a secret prompt or secret store, use that instead of a literal token. If it does not, warn the user once that the key may be stored in the MCP JSON and continue only with consent.

Do not enable unattended approval for paid generation tools.
