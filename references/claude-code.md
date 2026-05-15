# Claude Code Setup

Use this reference for Claude Code terminal or IDE sessions.

Claude Code supports remote HTTP MCP servers and bearer-token headers. It can store servers at local, project, or user scope.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer user scope when the user wants Advertisable available across Claude Code projects.
3. Use local scope when the user wants the server only for the current project.
4. Restart Claude Code or run `/mcp` after adding the server.
5. Confirm the `advertisable` server is connected and tools are visible.

## Quick Chat Setup

If the user chooses quick chat setup and pastes the key, run a command equivalent to:

```bash
claude mcp add --transport http --scope user advertisable https://api-adbot.advertisable.ai/mcp/ --header "Authorization: Bearer <token>"
```

If the user's Claude Code version requires options before the server name, use:

```bash
claude mcp add --transport http --header "Authorization: Bearer <token>" --scope user advertisable https://api-adbot.advertisable.ai/mcp/
```

Do not echo the token.

## Manual Setup

Give the user one of these placeholders:

```bash
claude mcp add --transport http --header "Authorization: Bearer <token>" --scope user advertisable https://api-adbot.advertisable.ai/mcp/
```

or:

```bash
claude mcp add-json advertisable '{"type":"http","url":"https://api-adbot.advertisable.ai/mcp/","headers":{"Authorization":"Bearer <token>"}}' --scope user
```

## Verify

```bash
claude mcp list
claude mcp get advertisable
```

Inside Claude Code, run:

```text
/mcp
```

If tools are missing, restart or reload the session before changing the token.

## Notes

Claude Code accepts `http` for remote HTTP MCP servers. JSON config may also accept `streamable-http` as an alias in current versions.
