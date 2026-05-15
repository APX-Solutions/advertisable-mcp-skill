# Zed Setup

Use this reference for Zed.

Zed configures MCP servers under `context_servers`. Remote MCP servers can include a URL and headers. If a remote server has no configured `Authorization` header, Zed may try OAuth instead.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Open Zed Agent Panel settings or edit Zed settings JSON.
3. Add a `context_servers.advertisable` entry.
4. Restart/reload the agent context if tools do not appear.
5. Confirm tools are listed before using them.

## Config

```json
{
  "context_servers": {
    "advertisable": {
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

If the user does not want the token in settings, use a client that supports secret interpolation or a future OAuth/proxy setup.
