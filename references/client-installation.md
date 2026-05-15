# Client Installation Index

Use this reference after `references/auth.md` when the user names an agent client or says they want the skill to install Advertisable in their current agent.

Always ask for the setup path first: private browser setup, quick chat setup, or manual setup. Do not ask for a key in chat until the user chooses quick chat setup.

## Pick The Client Reference

- OpenClaw: read `references/openclaw.md`.
- Hermes: read `references/hermes.md`.
- NemoClaw: read `references/nemoclaw.md`.
- Claude Code: read `references/claude-code.md`.
- Claude.ai, Claude Desktop remote connectors, Cowork, or Claude mobile: read `references/claude-connectors.md`.
- Cursor editor or `cursor-agent`: read `references/cursor.md`.
- Windsurf/Cascade: read `references/windsurf.md`.
- VS Code with GitHub Copilot Agent Mode: read `references/vscode.md`.
- Cline: read `references/cline.md`.
- Continue: read `references/continue.md`.
- Codex CLI or Codex IDE extension: read `references/codex.md`.
- Gemini CLI: read `references/gemini-cli.md`.
- OpenCode: read `references/opencode.md`.
- Kiro IDE/CLI/Web: read `references/kiro.md`.
- JetBrains AI Assistant or Junie: read `references/jetbrains-junie.md`.
- Zed: read `references/zed.md`.
- Unknown MCP-capable client: read `references/generic-mcp.md` and discover that client's config command, settings UI, or config file.

## Common Server Values

Server name:

```text
advertisable
```

Server URL:

```text
https://api-adbot.advertisable.ai/mcp/
```

Transport:

```text
streamable-http
```

Header:

```text
Authorization: Bearer <token>
```

## Restart Rule

After configuration, tell the user to restart the gateway, reload MCP servers, or begin a fresh session unless the client documentation says it hot-reloads remote MCP configuration. OpenClaw, Hermes, and NemoClaw should be treated as restart-required gateway clients.

## Verification Rule

Prefer the client's native verification command or MCP settings UI. A saved config entry only proves the client stored the server definition; it does not prove the token is accepted. If tools are missing, restart/reload first, then troubleshoot auth and transport.
