# OpenCode Setup

Use this reference for OpenCode.

OpenCode uses JSON or JSONC config. Global config is commonly `~/.config/opencode/opencode.json`; project config is `opencode.json` in the project root. MCP servers are configured under the `mcp` key.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer a user/global config for personal Advertisable access or project config for a workspace-specific setup.
3. Prefer environment or file interpolation if the user's OpenCode config supports it.
4. Restart OpenCode or begin a fresh session.
5. Confirm the `advertisable` tools are visible before using them.

## Config

Use this shape for a remote MCP server:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "advertisable": {
      "type": "remote",
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${env:ADVERTISABLE_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

If the user's OpenCode build does not support `headers` on remote MCP entries, use a compatible client or a future OAuth/proxy path.
