# Video Ad Workflows

Use this reference after the Advertisable MCP tools are visible in the live tool list.

## Core Tools

- `ping`: confirm connection and authenticated user.
- `list_brands`: find the user's available brands.
- `list_products`: find products under a brand.
- `create_video_ad`: submit a new AI video ad generation job.
- `get_ad_status`: poll or inspect a generation job.
- `list_recent_ads`: find previous jobs for a brand.
- `regenerate_variation`: create a new variation from an existing job.

## New Video Ad

Use when the user wants a new ad, commercial, promo video, product video, social ad, or storyboarded video creative.

Flow:

1. Call `list_brands`.
2. Match the user's brand wording to a returned brand.
3. If there is no clear brand match, show a digestible brand list and ask the user to choose.
4. Call `list_products` with the chosen `brand_id`.
5. Match the user's product wording to a returned product.
6. If products exist but the product is unclear, show a digestible product list and ask the user to choose.
7. If the brand has no products, tell the user and offer to continue without product context.
8. Build a concise prompt from the user's creative direction and product details.
9. Write the selected brand/product context to a temporary selection file if filesystem access is available.
10. Confirm brand, product or no-product choice, aspect ratio, storyboard count, and prompt before calling `create_video_ad`.
11. Call `create_video_ad`.
12. Delete the temporary selection file after `create_video_ad` returns a `job_id`, or when the user cancels.
13. Tell the user generation usually takes 2-4 minutes.
14. Use `get_ad_status` to check progress when useful.

Default choices when the user does not specify:

- `aspect_ratio`: `9:16` for social/video ads.
- `num_storyboards`: `1`.
- `product_id`: use the matched product when available; omit only when no product is available or the user explicitly wants generic/no-product creative.

Confirmation template:

```text
I found brand "<brand>" and product "<product>". I'll generate 1 vertical 9:16 video ad with this prompt: "<prompt>". This takes about 2-4 minutes and uses compute. Shall I start?
```

## Digestible Brand/Product Output

When showing brands or products to the user, never paste raw tool payloads, full JSON, or long unfiltered lists. Convert tool output into a short, scannable choice list.

Default format for brand choices:

```text
I found a few possible brands:

1. Brand Name
2. Another Brand
3. Third Brand

Which one should I use?
```

Default format for product choices:

```text
I found these matching products:

1. Product Name — short description or URL domain if useful
2. Another Product — short description or URL domain if useful
3. Third Product — short description or URL domain if useful

Which product should I use?
```

Rules:

- Show at most 5 options by default.
- If there are many results, show the best matches first and say there are more available.
- Use product names first; include descriptions only when they help distinguish similar products.
- Hide IDs by default. Include `brand_id`, `product_id`, or `job_id` only when the user asks for technical details or when confirming a precise selection would prevent ambiguity.
- Do not show the full `product_page_url` unless it helps the user distinguish products; prefer the domain or a short label.
- If one match is very likely, say which one you selected and ask for confirmation instead of listing many choices.
- Keep follow-up questions short: ask for brand choice or product choice, not every setting at once.

## Temporary Selection File

Use this workaround when `list_products` returns a large payload. After selecting the correct product, immediately write a compact working note so the selected `product_id` survives follow-up messages and does not get buried in context.

Prefer a temp-directory file, not a workspace file, so it does not linger in the user's project.

Windows pattern:

```text
%TEMP%\advertisable-selection-<session-or-process-id>.json
```

macOS/Linux pattern:

```text
/tmp/advertisable-selection-<session-or-process-id>.json
```

If the agent has a known session/thread ID, use it in the filename. Otherwise use the current process ID or another short unique suffix. If filesystem access is unavailable, keep the same JSON object as a short visible working note in the conversation before asking for confirmation.

Write only compact, non-secret context:

```json
{
  "alias": "current_product",
  "brand_id": "<brand uuid>",
  "brand_name": "<brand name>",
  "product_id": "<product uuid or null>",
  "product_name": "<product name or null>",
  "product_page_url": "<url or null>",
  "prompt": "<draft prompt>",
  "aspect_ratio": "9:16",
  "num_storyboards": 1,
  "created_at": "2026-05-13T10:00:00Z",
  "expires_at": "2026-05-13T12:00:00Z"
}
```

Rules:

- Do not write the API key, Authorization header, full `list_products` payload, or unrelated user data.
- Set `expires_at` to about 2 hours after creation.
- Read this file before calling `create_video_ad` if the conversation has moved on after product selection.
- Include the selected product name and `product_id` in the confirmation message when useful for accuracy.
- Delete the file after `create_video_ad` returns a `job_id`.
- Delete the file if the user cancels, changes brand, changes product, abandons the ad creation flow, or the file is past `expires_at`.

## Recent Ads

Use when the user asks what has been generated, wants to check recent ad jobs, or wants to find a source job for a variation.

Flow:

1. Call `list_brands`.
2. Resolve the brand.
3. Call `list_recent_ads` with `brand_id`.
4. Summarize recent jobs by status, prompt, creation time, and `adbot_job_id`.
5. Use `get_ad_status` when the user asks for details on a specific job.

## Job Status

Use when the user provides a job ID or asks whether an ad is done.

Flow:

1. Call `get_ad_status` with `job_id`.
2. If still running, report progress/status briefly and avoid resubmitting.
3. If complete, summarize the result and include available frame/video references from the response.
4. If failed, report the failure and offer to retry or adjust the prompt.

Do not create a second job just because the first one is still running.

## Regenerate Variation

Use when the user wants another version, variation, remix, or similar ad based on an existing generation.

Flow:

1. Identify `source_job_id` from the user or from `list_recent_ads`.
2. If the source job is unclear, show recent options and ask the user to choose.
3. Ask whether to keep the original character and location unless the user already specified.
4. Confirm before calling `regenerate_variation`.
5. Call `regenerate_variation`.
6. Use `get_ad_status` to check progress when useful.

Defaults:

- `keep_character`: `true`.
- `keep_location`: `true`.

Confirmation template:

```text
I'll generate a new variation from job <job_id>, keeping the same character and location. This takes about 2-4 minutes and uses compute. Shall I start?
```

## Safety And Quality Rules

- Confirm before calling `create_video_ad` or `regenerate_variation`.
- Do not invent `brand_id`, `product_id`, or `job_id`.
- Do not guess among multiple plausible brands or products.
- Preserve selected brand/product IDs in a session-scoped temp file when a large product list makes context loss likely.
- Delete the temp selection file after submitting the ad, when the user cancels, or when it expires.
- Do not promise immediate completion; generation usually takes 2-4 minutes.
- Do not include the API key in tool arguments.
- Keep user-facing summaries focused on brand, product, prompt, status, and IDs.
- Prefer one clear question over multiple questions when resolving ambiguity.
