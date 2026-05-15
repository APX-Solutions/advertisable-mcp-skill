# Kiro Setup

Use this reference for Kiro IDE, Kiro CLI, or Kiro Web when MCP configuration is available.

Kiro supports remote MCP entries with `url` and `headers` in an `mcpServers` JSON object.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Use Kiro's global, workspace, or agent-specific MCP config based on the user's preference.
3. Use a secret/env reference if available in that Kiro surface.
4. Reload Kiro MCP servers or start a fresh agent session.
5. Confirm tools are active before using them.

## Config

```json
{
  "mcpServers": {
    "advertisable": {
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${ADVERTISABLE_API_KEY}"
      },
      "disabled": false
    }
  }
}
```

Do not add paid tools to `autoApprove`. Keep `create_video_ad` and `regenerate_variation` user-confirmed.
