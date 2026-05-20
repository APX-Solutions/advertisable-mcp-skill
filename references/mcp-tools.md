# Advertisable MCP Tools

Based on the current live MCP tool set, then edited with mandatory agent workflow guidance. Prefer the live MCP schema if it differs from this file.

The MCP client should supply this header automatically:

```text
Authorization: Bearer <token>
```

Never include the API key in MCP tool arguments unless a live tool schema explicitly requires it.

## Toolchain Summary

Use this common sequence for new paid video ads:

```text
list_brands -> list_products -> get_wallet_balance -> write temp selection file -> confirm -> read temp selection file -> create_video_ad -> write job_id to temp selection file -> get_ad_status
```

Use this sequence for variations:

```text
list_brands -> list_recent_ads -> get_wallet_balance -> confirm -> regenerate_variation -> get_ad_status
```

Use this sequence to recreate an external reference video:

```text
list_brands -> optional list_products -> get_wallet_balance -> write temp selection file when product is selected -> confirm -> read temp selection file when used -> recreate_video -> write job_id to temp selection file -> get_ad_status
```

Read `references/video-ad-workflows.md` before creating or regenerating ads.

## ping

Purpose: Connection check. Returns the authenticated user's id and server version.

Use when:

- Verifying the MCP connection after setup.
- Debugging whether the current session can reach Advertisable.
- Confirming that the configured API key authenticates.

Do not use when:

- The user is asking for actual brand, product, wallet, or ad work; use the domain tools directly unless connection health is uncertain.

Input schema:

```json
{
  "properties": {},
  "title": "pingArguments",
  "type": "object"
}
```

Output interpretation:

- A successful response means the remote server accepted the request and knows the authenticated user.
- A failure usually means gateway reload, transport, or auth configuration is wrong.

## list_brands

Purpose: Lists all brands belonging to the authenticated user.

Use when:

- The user mentions a brand by name.
- The user asks to create, list, inspect, or regenerate ads and no `brand_id` is already known.
- You need to resolve human wording such as "my wine brand" into a `brand_id`.

Do not use when:

- The user already supplied a known valid `brand_id` and no brand name disambiguation is needed.

Input schema:

```json
{
  "properties": {},
  "title": "list_brandsArguments",
  "type": "object"
}
```

Output interpretation:

- Match the user's wording to returned brand names.
- If no brands are returned, tell the user there are no brands available for this account.
- If multiple brands could match, show a compact numbered list of at most 5 brand names and ask the user to choose.
- Do not paste raw brand JSON or long unfiltered lists into chat.
- Do not invent brand IDs.

## list_products

Purpose: Lists all products for a brand.

Use when:

- The user wants an ad for a specific product.
- You have resolved `brand_id` and need product context before creating an ad.
- The user asks what products are available for a brand.

Do not use when:

- The task is only to list recent ads, check wallet balance, or check status for a known job.
- The user explicitly wants generic brand creative without a product.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    }
  },
  "required": [
    "brand_id"
  ],
  "title": "list_productsArguments",
  "type": "object"
}
```

Output interpretation:

- Returned products include `product_id`, `name`, `description`, and `product_page_url`.
- If the brand has no products, tell the user and offer to generate without product context.
- If the user names a product that does not appear, surface a compact list of likely alternatives instead of guessing.
- Show at most 5 products by default, using product names and short distinguishing details. Do not paste the full product payload into chat.
- Hide `product_id` by default unless the user asks for technical details or the ID is needed to confirm a precise selection.
- Use a `product_id` in `create_video_ad` whenever a matching product exists.
- If the product payload is large, immediately copy only the selected brand/product fields into a session-scoped temp selection file as described in `references/video-ad-workflows.md`.
- Do not invent product IDs.

## get_wallet_balance

Purpose: Returns the authenticated user's current wallet balance.

Use when:

- The user asks about credits, wallet, balance, spend, or whether they can generate ads.
- Before calling `create_video_ad` or `regenerate_variation`, because these operations use compute.
- After an insufficient-credits or payment-related error.

Do not use when:

- The user only asks to list brands, list products, or inspect already-completed job details.

Input schema:

```json
{
  "properties": {},
  "title": "get_wallet_balanceArguments",
  "type": "object"
}
```

Output interpretation:

- `available_usd` is the spendable balance and is safe to quote directly.
- `reserved_usd` is held by in-flight reservations.
- `paid_usd` is total funded amount.
- `status` may be `active`, `frozen`, or `closed`.
- If status is not `active`, do not start paid generation; tell the user the wallet is not active.
- Present balances in plain language, for example: `Available balance: $12.50`.

## create_video_ad

Purpose: Generate an AI video advertisement from a text description.

Use when:

- The user wants a new AI video ad, product promo, social ad, creative concept, commercial, or storyboarded video.
- Brand and product context have been resolved, or the user explicitly agrees to generate without product context.

Required confirmation:

- Confirm before calling. This takes 2-4 minutes and costs compute.
- Confirm brand, product or no-product choice, prompt, aspect ratio, number of storyboards, and available wallet balance when known.

Do not use when:

- The user is only asking to check wallet balance or an existing job.
- The brand is ambiguous.
- The product is ambiguous and products are available.
- The wallet status is not active.
- The user has not consented after the compute-cost warning.

Recommended preflight:

1. `list_brands` to resolve `brand_id`.
2. `list_products` to resolve `product_id`.
3. Immediately write a session-scoped temp selection file with the compact selected brand/product context before asking follow-up creative questions. Prompt/settings may be `null` at this point.
4. Ask one concise clarification if brand/product is ambiguous.
5. Build or refine the prompt and update prompt/settings in the temp selection file.
6. Call `get_wallet_balance` to confirm the wallet is active and surface available balance.
7. Confirm the final generation parameters and compute use.
8. Immediately before calling `create_video_ad`, read the temp selection file back and use the `product_id` from the file.

Do not call `create_video_ad` from memory after selecting a product from `list_products`. Plain rule: never create a video ad from remembered product IDs. If the temp selection file is missing or expired, call `list_products` again and recreate it.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "prompt": {
      "title": "Prompt",
      "type": "string"
    },
    "product_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Product Id"
    },
    "num_storyboards": {
      "default": 1,
      "title": "Num Storyboards",
      "type": "integer"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "custom_script": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Custom Script"
    },
    "custom_script_segments": {
      "anyOf": [
        {
          "items": {
            "type": "string"
          },
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Custom Script Segments"
    },
    "segment_count": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Segment Count"
    },
    "broll_count": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Broll Count"
    }
  },
  "required": [
    "brand_id",
    "prompt"
  ],
  "title": "create_video_adArguments",
  "type": "object"
}
```

Parameter guidance:

- `brand_id`: required. Get from `list_brands`.
- `prompt`: required. Write a clear creative brief and visual direction from the user's words. If the user provides exact ad copy, do not rely on this field alone; pass the exact wording through `custom_script` or `custom_script_segments`.
- `product_id`: optional but strongly recommended. Get from `list_products` when a matching product exists.
- `num_storyboards`: 1-5. Default to 1 unless the user asks for variants.
- `aspect_ratio`: `"9:16"` default for social ads. Valid documented values: `"9:16"`, `"16:9"`, `"1:1"`.
- `custom_script`: optional string. Exact voiceover or ad copy to use verbatim. Use when the user says "use this script", "exact script", "word for word", or provides copy that should not be rewritten.
- `custom_script_segments`: optional array of strings. Exact pre-split voiceover segments, one per scene or A-roll segment. Prefer this over `custom_script` when the user provides multiple lines, scenes, or already-separated script beats.
- `segment_count`: optional integer. Overrides how `custom_script` is split into A-roll script segments. Ignored when `custom_script_segments` is provided.
- `broll_count`: optional integer. Overrides the number of B-roll visual segments. Use only when the user explicitly asks for a certain number of B-roll segments or the creative structure requires it.

Output interpretation:

- Returns immediately with a `job_id`.
- Generation usually takes 2-4 minutes.
- Use `get_ad_status` to inspect progress and final outputs.
- After a successful submission returns `job_id`, update the temp selection file with `latest_job_id`, `latest_job_type`, and `latest_job_created_at`. Do not delete the temp file after successful generation.

## recreate_video

Purpose: Recreate a reference video as a new ad, shot-for-shot.

Use when:

- The user shows or links a video they want to "make their own version of," "redo for their brand," "remake," "copy the style of," or "recreate."
- The source is an external reference URL rather than an existing Advertisable job.
- The user wants the reference video's shot composition, timing, and style analyzed and rebuilt for their selected brand or product.

Do not use when:

- The user wants another version of an existing Advertisable job; use `regenerate_variation`.
- The source video URL is ambiguous, missing, or points to a generic page that merely embeds a video.
- The brand is ambiguous.
- The product is ambiguous and products are available.
- The wallet status is not active.
- The user has not consented after the compute-cost warning.

Reference URL guidance:

- Direct HTTPS links to video files, S3/CDN URLs, and supported social-platform URLs such as YouTube, TikTok, Instagram, X/Twitter, or Facebook can work.
- Plain web pages or blog posts that embed a video may not work; ask for the direct video link or supported social URL.
- Confirm the exact reference URL before calling the tool.

Recommended preflight:

1. `list_brands` to resolve `brand_id`.
2. `list_products` to resolve `product_id` when the recreated ad should feature a specific product.
3. Immediately write a session-scoped temp selection file if a product is selected, before asking follow-up creative questions.
4. Confirm the reference URL and any optional creative direction.
5. Call `get_wallet_balance` to confirm the wallet is active and surface available balance.
6. Confirm the final recreation parameters and compute use.
7. Immediately before calling `recreate_video`, read the temp selection file back if a product was selected and use the `product_id` from the file.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "reference_video_url": {
      "title": "Reference Video Url",
      "type": "string"
    },
    "prompt": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Prompt"
    },
    "product_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Product Id"
    },
    "num_storyboards": {
      "default": 1,
      "title": "Num Storyboards",
      "type": "integer"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    }
  },
  "required": [
    "brand_id",
    "reference_video_url"
  ],
  "title": "recreate_videoArguments",
  "type": "object"
}
```

Parameter guidance:

- `brand_id`: required. Get from `list_brands`.
- `reference_video_url`: required. Use the exact URL confirmed by the user.
- `prompt`: optional. Use for extra creative direction layered on top of the analyzed reference video.
- `product_id`: optional but strongly recommended when a matching product exists. Get from `list_products`.
- `num_storyboards`: 1-5. Default to 1 unless the user asks for variants.
- `aspect_ratio`: `"9:16"` default for social ads. Valid documented values: `"9:16"`, `"16:9"`, `"1:1"`.

Output interpretation:

- Returns immediately with a `job_id`.
- Generation usually takes 2-4 minutes.
- Use `get_ad_status` to inspect progress and final outputs.
- In Claude.ai, the response may render as an auto-refreshing widget with storyboard tiles.
- After a successful submission returns `job_id`, update the temp selection file with `latest_job_id`, `latest_job_type`, and `latest_job_created_at`. Do not delete the temp file after successful generation.

## get_ad_status

Purpose: Get the current status of a video ad generation job.

Use when:

- The user asks whether a generation is done.
- `create_video_ad` or `regenerate_variation` returned a job ID.
- You need details for a recent ad job.

Do not use when:

- You do not have a `job_id`; use `list_recent_ads` if the user needs help finding one.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    }
  },
  "required": [
    "job_id"
  ],
  "title": "get_ad_statusArguments",
  "type": "object"
}
```

Output interpretation:

- Report current status and progress briefly.
- In Claude.ai, the response may render as an interactive status card with auto-refresh, storyboard tiles when complete, and a Recreate action.
- When complete, summarize storyboard details and generated frame/video references available in the response.
- If still running, do not resubmit. Tell the user generation usually takes 2-4 minutes.
- If failed, summarize the failure and offer to adjust or retry.

## list_recent_ads

Purpose: List recent video ad jobs for a brand, newest-first.

Use when:

- The user asks what ads were recently generated.
- The user wants to find a job to inspect or regenerate.
- The user describes a prior ad but does not know the `job_id`.

Do not use when:

- The user already supplied a known `job_id` and only wants status.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "limit": {
      "default": 20,
      "title": "Limit",
      "type": "integer"
    }
  },
  "required": [
    "brand_id"
  ],
  "title": "list_recent_adsArguments",
  "type": "object"
}
```

Parameter guidance:

- `brand_id`: required. Get from `list_brands`.
- `limit`: default 20. Use a smaller value when the user asks for "latest" or "last few".

Output interpretation:

- Summarize `adbot_job_id`, status, prompt, and creation time.
- Use `get_ad_status` for full details on a selected job.
- If no jobs are returned, tell the user no recent ad jobs were found for that brand.

## regenerate_variation

Purpose: Generate a new variation of an existing video ad.

Use when:

- The user asks for another version, variation, remix, or similar ad based on an existing job.
- A `source_job_id` is known or can be resolved from recent ads.

Required confirmation:

- Confirm before calling. This takes 2-4 minutes and costs compute.
- Confirm the source job, whether to keep character/location, and available wallet balance when known.

Do not use when:

- The source job is ambiguous.
- The wallet status is not active.
- The user has not consented after the compute-cost warning.
- The user actually wants a new concept unrelated to an existing job; use `create_video_ad`.

Input schema:

```json
{
  "properties": {
    "source_job_id": {
      "title": "Source Job Id",
      "type": "string"
    },
    "keep_character": {
      "default": true,
      "title": "Keep Character",
      "type": "boolean"
    },
    "keep_location": {
      "default": true,
      "title": "Keep Location",
      "type": "boolean"
    }
  },
  "required": [
    "source_job_id"
  ],
  "title": "regenerate_variationArguments",
  "type": "object"
}
```

Parameter guidance:

- `source_job_id`: required. Use the `adbot_job_id` of the source ad.
- `keep_character`: default `true`.
- `keep_location`: default `true`.

Output interpretation:

- Returns immediately with a new `job_id`.
- Generation usually takes 2-4 minutes.
- Use `get_ad_status` to inspect progress and final outputs.
- If a temp selection file exists, update it with the new `latest_job_id`, `latest_job_type`, and `latest_job_created_at`. Do not delete the temp file after successful generation.
