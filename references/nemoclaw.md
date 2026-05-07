# NemoClaw Setup

Use this reference when the user wants to connect Advertisable MCP through NemoClaw.

## Required MCP Config

NemoClaw must be configured with the Advertisable remote MCP server:

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

If NemoClaw supports secret values or environment interpolation, prefer that for the `Authorization` header.

## Setup Flow

1. Identify the NemoClaw MCP config command or config file location from the user's environment.
2. Use the private, agent-assisted, or manual setup mode selected by the user.
3. Add an MCP server named `advertisable`.
4. Restart the NemoClaw gateway or start a fresh agent session.
5. Confirm Advertisable tools appear in the live tool list.

## Important

Do the restart before treating missing tools as a broken token. Gateway-style clients commonly load MCP configuration at startup.
