# VS Code GitHub Copilot Setup

Use this reference for VS Code with GitHub Copilot Agent Mode.

VS Code supports MCP servers from workspace `.vscode/mcp.json` or user-level MCP configuration. For HTTP servers, VS Code first tries streamable HTTP and can use `headers` for authentication. Use `inputs` for sensitive values so VS Code prompts and stores the value instead of hardcoding it.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer an input variable for the Advertisable key.
3. Add the server to `.vscode/mcp.json` for the current workspace or to user settings for global use.
4. Open Copilot Chat in Agent mode.
5. Enable the Advertisable server in the tools picker if needed.
6. Start a fresh chat or reload MCP servers if the tools do not appear.

## Workspace Config

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "advertisable-api-key",
      "description": "Advertisable connection key",
      "password": true
    }
  ],
  "servers": {
    "advertisable": {
      "type": "http",
      "url": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${input:advertisable-api-key}"
      }
    }
  }
}
```

## Verify

Use the MCP server status UI in VS Code or ask Copilot Agent Mode to list available Advertisable tools. If it cannot see them, reload the window or start a fresh agent chat before changing credentials.
