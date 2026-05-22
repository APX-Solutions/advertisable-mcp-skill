# Advertisable MCP Skill

Agent skill for installing, configuring, and using the Advertisable remote MCP server for video ad creation and management.

This repository is a **skill package**. It does not contain the Advertisable MCP server itself. Instead, it teaches MCP-capable agents how to connect to the hosted Advertisable MCP server, handle the API key safely, reload the client/gateway, and use the exposed tools with the right workflow rules.

## MCP Server

```json
{
  "url": "https://api-adbot.advertisable.ai/mcp/",
  "transport": "streamable-http",
  "headers": {
    "Authorization": "Bearer <token>"
  }
}
```

The user needs an Advertisable API key or connection key. The MCP client should attach it as the `Authorization` bearer token header.

## Install This Skill

Give your agent this repo URL:

```text
https://github.com/APX-Solutions/advertisable-mcp-skill
```

If your agent supports installing skills from git repositories, ask it to install the skill from that URL.

If installing manually, clone the repository into your agent's skills directory:

```bash
git clone https://github.com/APX-Solutions/advertisable-mcp-skill.git advertisable-mcp
```

Then restart or reload the agent's skills if your client caches skill contents.

## Update This Skill

If the skill was installed from git, update it in place:

```bash
cd path/to/advertisable-mcp
git pull
```

Then restart or reload the agent session if skills are cached.

## Supported Agent Clients

The skill includes setup references for:

- OpenClaw, Hermes, and NemoClaw gateway-style clients
- Claude Code
- Claude.ai / Claude Desktop remote connectors
- Cursor and Cursor CLI
- Windsurf / Cascade
- VS Code with GitHub Copilot Agent Mode
- Cline
- Continue
- Codex CLI / Codex IDE extension
- Gemini CLI
- OpenCode
- Kiro
- JetBrains AI Assistant / Junie
- Zed
- Generic MCP-capable clients

See `references/client-installation.md` for the client selection index.

## Recommended Website Install Prompt

For end users, the recommended initial prompt is:

```text
Connect the Advertisable MCP at https://api-adbot.advertisable.ai/mcp/ — it supports OAuth device flow, with discovery at https://api-adbot.advertisable.ai/.well-known/oauth-protected-resource.

Run the device flow and send me the authorization link like:

Authorize here: https://app.advertisable.ai/device?code=XXXXXXXX

Then poll the token endpoint until I authorize and confirm once it succeeds.
Afterwards, if that succeeded, install this skill: https://github.com/APX-Solutions/advertisable-mcp-skill
```

When an agent follows that prompt, the MCP connection is established before the skill is installed. After loading the skill, the agent should not run the skill's bearer-token/API-key installer again. It should verify that the Advertisable tools are visible and then use the skill's tool workflow guidance.

## API Key Fallback Setup Paths

The API-key setup paths are fallbacks for users who install this skill directly from GitHub without first connecting the MCP through OAuth device flow, or for clients where OAuth setup is unsupported or failed.

In those fallback cases, the skill instructs agents to ask the user which setup path they prefer before requesting a key:

1. **Private browser setup**: the agent starts a localhost setup page, keeps the setup script running, and sends the user a local URL. The user enters the key in the browser, not in chat.
2. **Quick chat setup**: the user pastes the key into chat and the agent configures the MCP connection.
3. **Manual setup**: the agent gives commands or config snippets and the user runs them.

For OpenClaw private setup:

```bash
node scripts/connect-local-ui.js --client openclaw
```

Important: the setup script must remain running until the user submits the key and sees the success page. If the process exits early, the localhost page will go offline.

## OpenClaw Quick Setup

With an API key in the environment:

```bash
ADVERTISABLE_API_KEY=<token> node scripts/install-openclaw-mcp.js
```

Manual command:

```bash
openclaw mcp set advertisable '{"url":"https://api-adbot.advertisable.ai/mcp/","transport":"streamable-http","headers":{"Authorization":"Bearer <the token>"}}'
```

After setup, restart the OpenClaw gateway or start a fresh agent session so the tools appear.

## Tools Documented By The Skill

The current tool reference covers:

- `ping`
- `list_brands`
- `list_products`
- `get_wallet_balance`
- `create_video_ad`
- `recreate_video`
- `get_ad_status`
- `list_recent_ads`
- `regenerate_variation`

See `references/mcp-tools.md` and `references/video-ad-workflows.md`.

## Important Runtime Rules

The skill contains mandatory workflow guidance for agents:

- Read `SKILL.md` before using any Advertisable MCP tool, even if the tools are already visible.
- Confirm with the user before paid generation or variation actions.
- Check wallet balance before paid generation when possible.
- Present brands/products as short, digestible lists instead of raw JSON payloads.
- Do not rely on chat memory for selected product IDs after `list_products`.
- Store selected product context in a compact OS temp file.
- After generation, keep that temp file in `/tmp` or `%TEMP%` and update it with the returned `job_id` for follow-up status, variation, or recreate flows.
- Do not store API keys in the temp file.

## Repository Layout

```text
SKILL.md                         Main agent-facing skill instructions
agents/openai.yaml               Skill UI metadata
assets/server.json               Registry-style remote MCP metadata
scripts/connect-local-ui.js      Local private browser key entry flow
scripts/install-openclaw-mcp.js  OpenClaw MCP installer
scripts/verify-openclaw-mcp.js   OpenClaw config verifier
scripts/print-mcp-config.js      Client config snippet printer
scripts/generate-tools-reference.js  Live MCP tools reference generator
references/                      Client setup and tool workflow docs
```

## Refreshing Tool References

When the hosted MCP server adds or changes tools, regenerate the tool reference from the live server:

```bash
ADVERTISABLE_API_KEY=<token> node scripts/generate-tools-reference.js --out references/mcp-tools.md
```

Then manually review the generated content and preserve the mandatory workflow guidance in the curated reference.
