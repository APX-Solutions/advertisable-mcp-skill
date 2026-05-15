---
name: advertisable-mcp
description: MUST READ BEFORE USING Advertisable MCP tools. Contains mandatory runtime protocols for video ad creation and management, including product selection memory, temp file handling, wallet/balance checks before paid generation, confirmation before compute, and digestible brand/product outputs. Trigger on ANY Advertisable MCP usage: listing brands, listing products, checking wallet balance or credits, creating a video ad, checking ad job status, regenerating ad variations, installing/configuring/verifying/troubleshooting the Advertisable MCP server, API key, or bearer token across any MCP-capable agent client.
homepage: https://advertisable.ai
repository: https://github.com/advertisable/advertisable-mcp-skill
issues: https://github.com/advertisable/advertisable-mcp-skill/issues
author:
  name: Advertisable
  url: https://advertisable.ai
license: Apache-2.0
metadata:
  tags: advertisable, mcp, streamable-http, ads, marketing, automation, api-key, bearer-token
  vendor: advertisable
  official: true
  requires:
    bins: [node]
  primaryEnv: ADVERTISABLE_API_KEY
  envVars:
    - name: ADVERTISABLE_API_KEY
      required: true
      description: Advertisable API key used as the Bearer token for the MCP Authorization header.
  endpoints:
    - https://api-adbot.advertisable.ai/mcp/
  mcp:
    name: advertisable
    transport: streamable-http
    url: https://api-adbot.advertisable.ai/mcp/
    authHeader: Authorization
---

# Advertisable MCP

> **MANDATORY BEFORE TOOL USE**
> Read this skill before using any Advertisable MCP tool, even if the tools are already visible in your tool list. This file contains required runtime protocols, not just installation instructions. In particular, the product selection memory protocol, wallet/balance checks, confirmation rules, digestible brand/product output rules, and cleanup rules are mandatory before creating or regenerating ads.

Use this skill to install the Advertisable MCP connection into an agent's available tools, then guide the agent in using those tools well. The skill does not replace the MCP server; it teaches the agent how to mount it, reload the gateway, verify it, and read the bundled usage references.

## TL;DR

Never call `create_video_ad` from remembered product IDs.

Required flow after `list_products`:

```text
select product -> write temp selection file -> confirm with user -> read temp file -> create_video_ad -> write returned job_id to temp file
```

## Core Model

The Advertisable MCP server is remote:

```json
{
  "url": "https://api-adbot.advertisable.ai/mcp/",
  "transport": "streamable-http",
  "headers": {
    "Authorization": "Bearer <token>"
  }
}
```

The skill installs the connection. The MCP server provides the live tools. The reference docs teach the agent how to use the live tools safely and effectively.

## Mandatory Product Memory Protocol

When using `list_products`, do not rely on conversation memory for the selected product ID.

After selecting a product from `list_products`, immediately:

1. Save a compact temp selection file with `brand_id`, `brand_name`, `product_id`, `product_name`, and `expires_at`.
2. Do this before asking follow-up creative questions about the ad. Prompt/settings may be `null` at first.
3. Tell the user which product was selected in plain language.
4. Update prompt/settings in the temp file later if the ad creative changes before generation.
5. Before calling `create_video_ad`, read the temp selection file back.
6. Use the `product_id` from the temp selection file, not from memory.
7. After `create_video_ad`, `recreate_video`, or `regenerate_variation` returns a `job_id`, update the same temp file with that latest job id and job metadata.

Do not call `create_video_ad` from memory after a `list_products` response. Plain rule: never create a video ad from remembered product IDs. If no temp selection file exists, call `list_products` again and repeat the selection protocol.

Do not delete the temp file after successful generation. Leave it in the OS temp directory so follow-up requests can recover the selected product and latest job id without relying on chat memory. If the user changes brand/product, create or overwrite the temp file with the new selection instead of carrying old IDs forward.

## Install Workflow

1. Identify the user's agent client or gateway. If unknown, ask once.
2. On first-time setup, always ask the user which setup path they want before requesting or accepting any Advertisable connection key. Do not default to asking for the key in chat.
3. Offer exactly these setup modes in plain language:
   - **Private browser setup**: the agent starts a local setup page and sends the user a localhost link. The user enters their Advertisable connection key in the browser, not in chat.
   - **Quick chat setup**: the user pastes the Advertisable connection key into chat and the agent configures the connection.
   - **Manual setup**: the agent gives commands/config snippets and the user runs them.
4. Use this wording:

```text
How would you like to connect Advertisable?

1. Private browser setup: I give you a local link where you enter the key. The key is not pasted into chat.
2. Quick chat setup: you paste the key here and I configure it for you.
3. Manual setup: I show you the command/config and you run it yourself.
```

5. Read `references/auth.md` before handling tokens.
6. Read the relevant client reference:
   - OpenClaw: `references/openclaw.md`
   - Hermes: `references/hermes.md`
   - NemoClaw: `references/nemoclaw.md`
   - Claude Code: `references/claude-code.md`
   - Claude.ai, Claude Desktop remote connectors, Cowork, or mobile: `references/claude-connectors.md`
   - Cursor or Cursor CLI: `references/cursor.md`
   - Windsurf/Cascade: `references/windsurf.md`
   - VS Code with GitHub Copilot Agent Mode: `references/vscode.md`
   - Cline: `references/cline.md`
   - Continue: `references/continue.md`
   - Codex CLI or Codex IDE extension: `references/codex.md`
   - Gemini CLI: `references/gemini-cli.md`
   - OpenCode: `references/opencode.md`
   - Kiro: `references/kiro.md`
   - JetBrains AI Assistant or Junie: `references/jetbrains-junie.md`
   - Zed: `references/zed.md`
   - Other clients: start with `references/client-installation.md`, then use `references/generic-mcp.md`
7. Configure the MCP server using the selected setup path.
8. Tell the user to restart the gateway or begin a fresh agent session. This is required or commonly needed for gateway-style clients such as OpenClaw, Hermes, and NemoClaw.
9. Verify the MCP entry when the client exposes a verification command.
10. If tools are missing after setup, read `references/error-handling.md` before changing the token or config.

## Private Browser Setup Is A Live Process

When the user chooses private browser setup, the local setup script must stay running until the user finishes submitting the key.

Mandatory rules:

1. Start `node scripts/connect-local-ui.js --client openclaw` in a long-running/background terminal session, task, or process that the agent keeps alive.
2. Do not run the setup script as a one-shot command that the agent tool kills after printing `SETUP_URL`.
3. Do not close, cancel, interrupt, or let the command timeout while waiting for the user.
4. Send the printed `SETUP_URL` to the user and explicitly wait for them to submit the key and report that setup is done.
5. Keep the process alive until the browser shows the success page, the script exits on its own, or the user cancels.
6. If the browser shows a "page offline", "connection refused", or similar localhost error before the user submits the key, assume the agent killed the setup script too early. Restart the script in a persistent session and give the user the new localhost URL.

## Update Workflow

If the user already installed this skill from a git repository and asks to update, refresh, pull latest, or reinstall the latest version, update the skill checkout with git instead of reinstalling from scratch.

1. Locate the installed `advertisable-mcp` skill directory. It should contain this `SKILL.md` and a `.git` directory.
2. Run:

```bash
git pull
```

3. If the agent client caches skill contents, restart the agent session or reload skills after the pull.
4. If `git pull` fails because the directory is not a git repository, reinstall from the public skill repo link instead of editing files manually.

## OpenClaw Quick Path

Prefer the bundled installer when Node.js is available:

```bash
node scripts/install-openclaw-mcp.js
```

Environment-variable setup:

```bash
ADVERTISABLE_API_KEY=<token> node scripts/install-openclaw-mcp.js
```

Manual direct setup:

```bash
openclaw mcp set advertisable '{"url":"https://api-adbot.advertisable.ai/mcp/","transport":"streamable-http","headers":{"Authorization":"Bearer <the token>"}}'
```

Then restart the OpenClaw gateway or start a fresh session.

## Using Advertisable Tools

Once the gateway has reloaded, the agent should see Advertisable MCP tools in its live tool list. Before using them, read `references/mcp-tools.md`.

Advertisable currently exposes this video-ad toolchain:

```text
ping
list_brands
list_products
create_video_ad
get_ad_status
list_recent_ads
regenerate_variation
recreate_video
get_wallet_balance
```

Before creating or regenerating ads, also read `references/video-ad-workflows.md`. Confirm with the user before calling tools that spend compute or start generation. Present brand and product choices in compact, user-friendly lists rather than raw payloads. When a product is selected from a large `list_products` response, preserve the compact selection in a session-scoped temp file as described in `references/video-ad-workflows.md`, then update that file with returned job IDs after generation so follow-up commands can recover them.

If the user asks to maintain or publish this skill, refresh the tool reference from the live server:

```bash
ADVERTISABLE_API_KEY=<token> node scripts/generate-tools-reference.js --out references/mcp-tools.md
```

Use the live MCP schema as the source of truth if it differs from bundled references.

## Bundled Resources

- `scripts/install-openclaw-mcp.js`: Configures the OpenClaw MCP registry entry.
- `scripts/connect-local-ui.js`: Starts a localhost browser page for private, non-technical OpenClaw setup.
- `scripts/verify-openclaw-mcp.js`: Checks that OpenClaw has an `advertisable` MCP entry.
- `scripts/generate-tools-reference.js`: Queries MCP `tools/list` and renders Markdown docs.
- `scripts/print-mcp-config.js`: Prints generic Advertisable MCP config snippets.
- `references/auth.md`: Token handling, private setup, and agent-assisted setup.
- `references/client-installation.md`: Client selection index for major MCP-capable agents.
- `references/openclaw.md`: OpenClaw install, restart, and verification.
- `references/hermes.md`: Hermes install guidance and restart expectations.
- `references/nemoclaw.md`: NemoClaw install guidance and restart expectations.
- `references/claude-code.md`: Claude Code install commands and scopes.
- `references/claude-connectors.md`: Claude.ai/Claude Desktop remote connector guidance and limits.
- `references/cursor.md`: Cursor and Cursor CLI MCP configuration.
- `references/windsurf.md`: Windsurf/Cascade MCP configuration.
- `references/vscode.md`: VS Code GitHub Copilot MCP configuration.
- `references/cline.md`: Cline remote server setup.
- `references/continue.md`: Continue MCP server setup.
- `references/codex.md`: Codex CLI/IDE MCP configuration.
- `references/gemini-cli.md`: Gemini CLI MCP configuration.
- `references/opencode.md`: OpenCode MCP configuration.
- `references/kiro.md`: Kiro MCP configuration.
- `references/jetbrains-junie.md`: JetBrains AI Assistant and Junie MCP configuration.
- `references/zed.md`: Zed MCP configuration.
- `references/generic-mcp.md`: Generic `streamable-http` MCP config shape.
- `references/mcp-tools.md`: How to use mounted Advertisable tools.
- `references/video-ad-workflows.md`: End-to-end workflows for creating ads, checking jobs, and regenerating variations.
- `references/error-handling.md`: Missing tools, auth failures, transport failures, and stale gateways.
- `assets/server.json`: Registry-style metadata for the remote MCP server.
