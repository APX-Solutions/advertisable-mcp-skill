# Codex Setup

Use this reference for Codex CLI and Codex IDE extension.

Codex supports streamable HTTP MCP servers. The CLI and IDE extension share MCP configuration, so configuring once should make the server available in both surfaces.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Prefer `ADVERTISABLE_API_KEY` with Codex's bearer-token env var support.
3. Add the MCP server with the Codex CLI or by editing `~/.codex/config.toml`.
4. Restart Codex or begin a fresh session.
5. Verify with `codex mcp list`.

## Private Or Manual Env Setup

Ask the user to set:

```bash
ADVERTISABLE_API_KEY=<token>
```

Then add the server:

```bash
codex mcp add advertisable --url https://api-adbot.advertisable.ai/mcp/ --bearer-token-env-var ADVERTISABLE_API_KEY
```

## Config File Shape

If editing `~/.codex/config.toml` directly:

```toml
[mcp_servers.advertisable]
url = "https://api-adbot.advertisable.ai/mcp/"
bearer_token_env_var = "ADVERTISABLE_API_KEY"
```

If the user's Codex version requires explicit headers instead of `bearer_token_env_var`, use its current MCP config help and map `Authorization` to the environment variable rather than storing the literal token.

## Verify

```bash
codex mcp list
```

Start a fresh Codex session if the server was added while Codex was already running.
