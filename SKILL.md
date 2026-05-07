---
name: advertisable-mcp
description: Install, configure, restart, verify, and use the Advertisable remote MCP server at https://api-adbot.advertisable.ai/mcp/ across MCP-capable agent clients. Use when a user asks to connect Advertisable to an agent, configure an Advertisable API key or bearer token, choose private versus agent-assisted MCP setup, install the MCP connection in OpenClaw or another gateway-style client, troubleshoot missing Advertisable MCP tools, or learn how to use the Advertisable MCP tools after they are mounted.
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

Use this skill to install the Advertisable MCP connection into an agent's available tools, then guide the agent in using those tools well. The skill does not replace the MCP server; it teaches the agent how to mount it, reload the gateway, verify it, and read the bundled usage references.

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

## Install Workflow

1. Identify the user's agent client or gateway. If unknown, ask once.
2. Offer setup modes without pressure:
   - **Private guided install**: user keeps the API key out of chat via local prompt, environment variable, secret UI, or manual config.
   - **Agent-assisted install**: user pastes the API key into chat and the agent configures the connection.
   - **Manual install**: agent gives commands/config snippets and the user runs them.
3. Read `references/auth.md` before handling tokens.
4. Read the relevant client reference:
   - OpenClaw: `references/openclaw.md`
   - Hermes: `references/hermes.md`
   - NemoClaw: `references/nemoclaw.md`
   - Other clients: `references/generic-mcp.md`
5. Configure the MCP server.
6. Tell the user to restart the gateway or begin a fresh agent session. This is required or commonly needed for gateway-style clients such as OpenClaw, Hermes, and NemoClaw.
7. Verify the MCP entry when the client exposes a verification command.
8. If tools are missing after setup, read `references/error-handling.md` before changing the token or config.

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
```

Before creating or regenerating ads, also read `references/video-ad-workflows.md`. Confirm with the user before calling tools that spend compute or start generation.

If the user asks to maintain or publish this skill, refresh the tool reference from the live server:

```bash
ADVERTISABLE_API_KEY=<token> node scripts/generate-tools-reference.js --out references/mcp-tools.md
```

Use the live MCP schema as the source of truth if it differs from bundled references.

## Bundled Resources

- `scripts/install-openclaw-mcp.js`: Configures the OpenClaw MCP registry entry.
- `scripts/verify-openclaw-mcp.js`: Checks that OpenClaw has an `advertisable` MCP entry.
- `scripts/generate-tools-reference.js`: Queries MCP `tools/list` and renders Markdown docs.
- `scripts/print-mcp-config.js`: Prints generic Advertisable MCP config snippets.
- `references/auth.md`: Token handling, private setup, and agent-assisted setup.
- `references/openclaw.md`: OpenClaw install, restart, and verification.
- `references/hermes.md`: Hermes install guidance and restart expectations.
- `references/nemoclaw.md`: NemoClaw install guidance and restart expectations.
- `references/generic-mcp.md`: Generic `streamable-http` MCP config shape.
- `references/mcp-tools.md`: How to use mounted Advertisable tools.
- `references/video-ad-workflows.md`: End-to-end workflows for creating ads, checking jobs, and regenerating variations.
- `references/error-handling.md`: Missing tools, auth failures, transport failures, and stale gateways.
- `assets/server.json`: Registry-style metadata for the remote MCP server.
