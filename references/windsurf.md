# Windsurf Setup

Use this reference for Windsurf/Cascade.

Windsurf stores MCP config in `~/.codeium/windsurf/mcp_config.json` and supports remote HTTP MCP entries using `serverUrl` or `url`. It supports interpolation in `headers`, including environment variables and file contents.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer `${env:ADVERTISABLE_API_KEY}` or `${file:...}` over a literal token.
3. Add `advertisable` to the Windsurf MCP config.
4. Restart/reload Cascade MCP servers.
5. Confirm Advertisable tools are listed.

## Config

```json
{
  "mcpServers": {
    "advertisable": {
      "serverUrl": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:ADVERTISABLE_API_KEY}"
      }
    }
  }
}
```

If the user's Windsurf version expects `url`, use:

```json
{
  "mcpServers": {
    "advertisable": {
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:ADVERTISABLE_API_KEY}"
      }
    }
  }
}
```

## Manual Secret File Option

If the user prefers a local file secret and Windsurf can interpolate it:

```json
{
  "mcpServers": {
    "advertisable": {
      "serverUrl": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${file:~/.advertisable/api_key}"
      }
    }
  }
}
```

The file should contain only the raw token, not `Bearer`.
