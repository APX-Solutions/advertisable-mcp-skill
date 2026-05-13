# Error Handling

Diagnose in this order.

## Tools Are Missing

Likely causes:

- The gateway has not restarted after MCP config changed.
- The current agent session was started before setup.
- The MCP entry is saved under the wrong name.
- The client does not support remote `streamable-http`.
- The config file or registry command wrote to a different profile/workspace.

Actions:

1. Restart the gateway or start a fresh agent session.
2. Verify the MCP entry exists.
3. Confirm the URL is `https://api-adbot.advertisable.ai/mcp/`.
4. Confirm the transport is `streamable-http`.
5. Confirm the header is present as `Authorization: Bearer <token>`.

## Auth Failures

Likely causes:

- Missing token.
- Expired or revoked token.
- Header says `Bearer Bearer <token>`.
- Token pasted with extra whitespace or quotes.
- The wrong user's key was configured.

Actions:

1. Reconfigure with a freshly copied key.
2. Normalize the token so there is exactly one `Bearer ` prefix.
3. Avoid printing the token while debugging.

## Brand Or Product Resolution

Likely causes:

- `list_brands` returned no brands.
- The user's brand wording matches multiple brands.
- `list_products` returned no products for the selected brand.
- The user named a product that is not in the returned product list.

Actions:

1. If there are no brands, tell the user their account has no available brands.
2. If multiple brands match, show a compact numbered list of at most 5 brand names and ask the user to choose.
3. If there are no products, offer to generate without product context and explain visuals may be less consistent.
4. If the product is not found, show up to 5 likely product alternatives with names and short distinguishing details instead of guessing.
5. Never invent `brand_id` or `product_id`.

## Lost Product Selection

Likely causes:

- `list_products` returned a large payload and the selected `product_id` was lost in later context.
- The user resumed the ad creation flow after another topic.
- The agent selected the right product once but did not preserve a compact working note.
- The agent waited until just before generation to save the product instead of saving immediately after product selection.

Actions:

1. Check the agent's temp directory for the session-scoped Advertisable selection file, such as `%TEMP%\advertisable-selection-<session>.json` or `/tmp/advertisable-selection-<session>.json`.
2. If present, read `brand_id`, `brand_name`, `product_id`, and `product_name` from that file before calling `create_video_ad`.
3. If the file is past `expires_at`, delete it and recreate the selection by calling `list_products` again.
4. If missing, call `list_products` again and recreate the compact selection file after choosing the product.
5. If the product was selected but the file was not created immediately, create it now and treat that as a protocol recovery.
6. Do not call `create_video_ad` from memory when the selection file is missing, expired, or ambiguous. Plain rule: never create a video ad from remembered product IDs.
7. Delete the selection file after `create_video_ad` returns a `job_id`, or when the user cancels or changes the selected brand/product.
8. Never store the API key or full product payload in the selection file.

## Generation Jobs

Likely causes:

- `create_video_ad` returned a job that is still running.
- `regenerate_variation` returned a job that is still running.
- The user asks for status but does not know the `job_id`.
- A job failed during generation.

Actions:

1. Use `get_ad_status` for known job IDs.
2. Use `list_recent_ads` to help find unknown recent jobs.
3. If a job is still running, tell the user generation usually takes 2-4 minutes and do not resubmit.
4. If a job failed, summarize the failure and offer to retry with adjusted prompt or settings.
5. Before creating or regenerating, confirm compute use and generation time with the user.

## Wallet And Credits

Likely causes:

- Wallet status is `frozen` or `closed`.
- Available balance is too low.
- Funds are reserved by in-flight jobs.
- A generation tool reports insufficient credits.

Actions:

1. Call `get_wallet_balance`.
2. Quote `available_usd` in plain language.
3. If `reserved_usd` is nonzero, mention that some funds are reserved by in-flight work.
4. If wallet status is not `active`, do not call `create_video_ad` or `regenerate_variation`.
5. If credits are insufficient, tell the user the available balance and ask them to add funds or reduce the request before retrying.

## Transport Failures

Likely causes:

- Network cannot reach the remote MCP server.
- Client lacks `streamable-http` support.
- Server returned an HTTP error.
- Proxy or firewall blocked outbound HTTPS.

Actions:

1. Confirm the client supports remote streamable HTTP MCP servers.
2. Confirm outbound HTTPS to `https://api-adbot.advertisable.ai/mcp/`.
3. Retry once after restart.
4. If the entry exists and network is reachable, ask the user whether the token may have been revoked.

## Stale References

If a tool name, parameter, or behavior differs from `references/mcp-tools.md`, prefer the live MCP schema and update the reference later.
