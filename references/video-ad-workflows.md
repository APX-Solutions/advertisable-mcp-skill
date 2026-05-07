# Video Ad Workflows

Use this reference after the Advertisable MCP tools are visible in the live tool list.

## Core Tools

- `ping`: confirm connection and authenticated user.
- `list_brands`: find the user's available brands.
- `create_video_ad`: submit a new AI video ad generation job.
- `get_ad_status`: poll or inspect a generation job.
- `list_recent_ads`: find previous jobs for a brand.
- `regenerate_variation`: create a new variation from an existing job.

## New Video Ad

Use when the user wants a new ad, commercial, promo video, product video, social ad, or storyboarded video creative.

Flow:

1. Call `list_brands`.
2. Match the user's brand wording to a returned brand.
3. If there is no clear brand match, show concise options and ask the user to choose.
4. If the user provides a known `product_id`, include it. Otherwise, put the product description in the prompt.
5. Build a concise prompt from the user's creative direction and product details.
6. Confirm brand, product description or known product ID, aspect ratio, storyboard count, and prompt before calling `create_video_ad`.
7. Call `create_video_ad`.
8. Tell the user generation usually takes 2-4 minutes.
9. Use `get_ad_status` to check progress when useful.

Default choices when the user does not specify:

- `aspect_ratio`: `9:16` for social/video ads.
- `num_storyboards`: `1`.
- `product_id`: omit unless the user or another trusted source provides a known product ID.

Confirmation template:

```text
I found brand "<brand>". I'll generate 1 vertical 9:16 video ad with this prompt: "<prompt>". This takes about 2-4 minutes and uses compute. Shall I start?
```

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
- Do not guess among multiple plausible brands.
- Do not promise immediate completion; generation usually takes 2-4 minutes.
- Do not include the API key in tool arguments.
- Keep user-facing summaries focused on brand, prompt, status, and IDs.
- Prefer one clear question over multiple questions when resolving ambiguity.
