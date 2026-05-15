# Continue Setup

Use this reference for Continue.

Continue can load MCP server definitions from `.continue/mcpServers/` and can also pick up JSON MCP config files copied from clients such as Claude Desktop, Cursor, or Cline.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer a workspace-local `.continue/mcpServers/advertisable.yaml` or `.continue/mcpServers/mcp.json`.
3. Use environment variables for secrets when the user's Continue version supports them.
4. Reload Continue or restart the IDE extension.
5. Confirm Advertisable tools are available.

## YAML Config

```yaml
name: Advertisable MCP
version: 0.0.1
schema: v1
mcpServers:
  - name: advertisable
    type: streamable-http
    url: https://api-adbot.advertisable.ai/mcp/
    headers:
      Authorization: Bearer ${env:ADVERTISABLE_API_KEY}
```

## JSON Config Fallback

Create `.continue/mcpServers/mcp.json`:

```json
{
  "mcpServers": {
    "advertisable": {
      "type": "streamable-http",
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:ADVERTISABLE_API_KEY}"
      }
    }
  }
}
```

If the current Continue release does not pass headers for streamable HTTP servers, use a compatible MCP client or a future OAuth/proxy setup.
