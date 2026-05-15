# Cursor Setup

Use this reference for Cursor editor and `cursor-agent`.

Cursor reads MCP configuration from `mcp.json`. Project config lives at `.cursor/mcp.json`; global config lives at `~/.cursor/mcp.json`. Cursor CLI uses the same MCP configuration as the editor.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Choose project config for a single workspace or global config for all Cursor projects.
3. Prefer environment-variable interpolation for secrets when available.
4. Restart Cursor or open a fresh agent chat after config changes.
5. Verify with Cursor MCP UI or `cursor-agent mcp list`.

## Config Shape

Use this shape when Cursor supports remote HTTP header config:

```json
{
  "mcpServers": {
    "advertisable": {
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "type": "streamable-http",
      "headers": {
        "Authorization": "Bearer ${env:ADVERTISABLE_API_KEY}"
      }
    }
  }
}
```

If the Cursor version expects `transport` instead of `type`, adapt only that key:

```json
{
  "mcpServers": {
    "advertisable": {
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer ${env:ADVERTISABLE_API_KEY}"
      }
    }
  }
}
```

## Verify

```bash
cursor-agent mcp list
cursor-agent mcp list-tools advertisable
```

If Cursor attempts OAuth instead of sending headers, use a client that reliably supports static bearer headers or add an Advertisable-compatible OAuth/proxy path later.
