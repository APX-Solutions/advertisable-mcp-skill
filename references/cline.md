# Cline Setup

Use this reference for Cline.

Cline supports remote MCP servers and recommends Streamable HTTP for modern remote servers. Users can add remote servers from the MCP Servers interface.

## Setup Flow

1. Ask the user to choose private browser setup, quick chat setup, or manual setup before requesting a key.
2. Open Cline's MCP Servers interface.
3. Use the Remote Servers tab.
4. Add:

```text
Server name: advertisable
Server URL: https://api-adbot.advertisable.ai/mcp/
Transport type: Streamable HTTP
Authorization: Bearer <token>
```

5. If Cline's UI/config does not expose custom headers for remote servers, use its advanced JSON config if available. If bearer headers are still unsupported, use another client or a future OAuth/proxy path.
6. Reload Cline or reconnect the server.
7. Confirm the server has a healthy status and tools are visible.

## Tool Approval

Cline may ask for approval before tool calls. The user should review tool parameters before approving paid operations such as `create_video_ad` or `regenerate_variation`.
