# Gemini CLI Setup

Use this reference for Google Gemini CLI.

Gemini CLI uses `settings.json` with an `mcpServers` object. For streamable HTTP MCP servers, use `httpUrl`. Gemini also supports custom `headers`.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer environment-variable interpolation rather than a literal key in config.
3. Add the server at user or project scope.
4. Restart Gemini CLI or start a fresh `gemini` session.
5. Verify with `/mcp` or `gemini mcp list`.

## Config

Add to the relevant Gemini `settings.json`:

```json
{
  "mcpServers": {
    "advertisable": {
      "httpUrl": "https://api-adbot.advertisable.ai/mcp/",
      "headers": {
        "Authorization": "Bearer ${ADVERTISABLE_API_KEY}"
      },
      "trust": false
    }
  }
}
```

On Windows, `%ADVERTISABLE_API_KEY%` may be used where the user's Gemini version supports Windows-style expansion.

## Verify

```bash
gemini mcp list
```

Inside Gemini CLI:

```text
/mcp
```

Do not set `trust: true` just to avoid prompts. Paid generation tools should remain reviewable.
