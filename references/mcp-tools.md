# Advertisable MCP Tools

Based on the current live MCP tool set, then edited with agent workflow guidance. Prefer the live MCP schema if it differs from this file.

The MCP client should supply this header automatically:

```text
Authorization: Bearer <token>
```

Never include the API key in MCP tool arguments unless a live tool schema explicitly requires it.

## Toolchain Summary

Use this common sequence for new video ads:

```text
list_brands -> list_products -> confirm -> create_video_ad -> get_ad_status
```

Use this sequence for variations:

```text
list_brands -> list_recent_ads -> confirm -> regenerate_variation -> get_ad_status
```

Read `references/video-ad-workflows.md` before creating or regenerating ads.

## ping

Purpose: Connection check. Returns the authenticated user's id and server version.

Use when:

- Verifying the MCP connection after setup.
- Debugging whether the current session can reach Advertisable.
- Confirming that the configured API key authenticates.

Do not use when:

- The user is asking for actual brand, product, or ad work; use the domain tools directly unless connection health is uncertain.

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

- The task is only to list recent ads or check status for a known job.
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

## create_video_ad

Purpose: Generate an AI video advertisement from a text description.

Use when:

- The user wants a new AI video ad, product promo, social ad, creative concept, commercial, or storyboarded video.
- Brand and product context have been resolved, or the user explicitly agrees to generate without product context.

Required confirmation:

- Confirm before calling. This takes 2-4 minutes and costs compute.
- Confirm brand, product or no-product choice, prompt, aspect ratio, and number of storyboards.

Do not use when:

- The user is only asking to check an existing job.
- The brand is ambiguous.
- The product is ambiguous and products are available.
- The user has not consented after the compute-cost warning.

Recommended preflight:

1. `list_brands` to resolve `brand_id`.
2. `list_products` to resolve `product_id`.
3. Write a session-scoped temp selection file with the compact selected brand/product context if filesystem access is available.
4. Ask one concise clarification if brand/product is ambiguous.
5. Confirm the final generation parameters.

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
- `prompt`: required. Write a clear creative brief from the user's words.
- `product_id`: optional but strongly recommended. Get from `list_products` when a matching product exists.
- `num_storyboards`: 1-5. Default to 1 unless the user asks for variants.
- `aspect_ratio`: `"9:16"` default for social ads. Valid documented values: `"9:16"`, `"16:9"`, `"1:1"`.

Output interpretation:

- Returns immediately with a `job_id`.
- Generation usually takes 2-4 minutes.
- Use `get_ad_status` to inspect progress and final outputs.
- After a successful submission returns `job_id`, delete the temp selection file if it was created for this ad flow.

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
- Confirm the source job and whether to keep character and location.

Do not use when:

- The source job is ambiguous.
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
