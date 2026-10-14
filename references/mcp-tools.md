# Advertisable MCP Tools

Generated from the server's tool definitions, with a toolchain summary on top. Prefer the live MCP schema if it differs from this file.

The MCP client should supply this header automatically:

```text
Authorization: Bearer <token>
```

Never include the API key in MCP tool arguments unless a live tool schema explicitly requires it.

## Toolchain Summary

New UGC video ad (a person talking to camera):

```text
list_brands -> list_products -> get_wallet_balance -> write temp selection file -> confirm -> read temp selection file -> create_video_ad_v2 (or create_video_ad) -> write job_id to temp selection file -> get_ad_status_v2 (or get_ad_status) -> show_ad
```

Any other ad type (choose with the table in `references/video-ad-workflows.md`):

```text
list_brands -> list_products -> get_wallet_balance -> confirm -> create_<type> -> poll its status tool -> show_ad
```

Final video and share link:

```text
show_ad -> confirm -> generate_full_video -> get_full_video_status -> create_video_share
```

Fix a storyboard before the video:

```text
edit_frames (keep everything else) | list_client_comments -> apply_client_comments -> regenerate_frames -> generate_segment_videos
```

Variation of an existing ad, or a remake of a reference video:

```text
list_brands -> list_recent_ads -> get_wallet_balance -> confirm -> regenerate_variation -> get_ad_status
list_brands -> optional list_products -> get_wallet_balance -> confirm -> recreate_video -> get_ad_status
```

Read `references/video-ad-workflows.md` before creating, editing or rendering ads.

## Tool Index

- Account and brands: `ping`, `get_wallet_balance`, `list_brands`, `create_brand`, `start_brand_onboarding`, `get_brand_dna`
- Products: `list_products`, `analyze_product`
- UGC video ads: `create_video_ad`, `get_ad_status`, `create_video_ad_v2`, `get_ad_status_v2`, `create_multivideo_ads`, `create_ad_from_website`, `get_website_ad_status`, `regenerate_variation`, `recreate_video`
- Other video ads: `create_freestyle_ad`, `get_freestyle_status`, `generate_freestyle_videos`, `create_animated_ad`, `create_broll_ad`, `create_motion_ad`, `edit_motion_film`, `create_duo_ad`, `approve_duo_gate`, `create_shorts_ad`, `get_shorts_status`, `revise_short`, `get_flow_status`
- Avatars: `create_avatar`, `list_avatars`, `use_avatar`
- Images: `create_static_ads`, `retry_static_ad`, `generate_carousel`, `get_carousel_status`, `regenerate_carousel_slide`, `generate_post_visual`, `get_post_visual_status`
- Storyboard edits: `edit_frames`, `regenerate_frames`, `generate_segment_videos`, `list_client_comments`, `apply_client_comments`
- Seeing, finishing and sharing: `show_ad`, `list_recent_ads`, `generate_full_video`, `get_full_video_status`, `finalize_video`, `get_reviewed_cut`, `create_video_share`

## analyze_product

Analyzes one of the brand's products with AI vision so it can feature
in ad generation.

Use on products that list_products returns with analyzed=false (fresh
website-catalog imports from start_brand_onboarding). Already-analyzed
products return immediately with cached=true. Takes ~10-30 seconds.

Args:
brand_id: Brand UUID (from list_brands).
product_id: Product id from list_products.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "product_id": {
      "title": "Product Id",
      "type": "string"
    }
  },
  "required": [
    "brand_id",
    "product_id"
  ],
  "title": "analyze_productArguments",
  "type": "object"
}
```

## apply_client_comments

Apply a client's feedback to the frames it was left on.

Args:
brand_id: Brand UUID.
job_id: The storyboard job to edit (from list_client_comments).
frame_comments: [{"segment_id": "...", "text": "..."}] — the client's
words and the frame each note belongs to. Pass these through from
list_client_comments unchanged.
general_comments: ["..."] — notes about the whole storyboard.
storyboard_name: for context in the instruction.
allow_structure: False keeps every segment and its order: only the
words of existing segments change, and a b-roll or custom frame
given a line gets its voiceover switch turned on. Segments the edit
tried to drop or add come back under structure_refused. Automated
revisions pass False.

Returns {"applied": bool, "operations": N, ...}.

Pass the client's text VERBATIM. Measurements, product names and quoted
script lines are the substance of a note; a summary of them produces an edit
that looks done and is not, and the client writes the same note again.

After applying, read the frames back with get_ad_status_v2 and check each
comment against what is actually there before telling anyone it is fixed. A
note asking for a bigger box is not addressed by a new camera angle.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "frame_comments": {
      "anyOf": [
        {
          "items": {
            "additionalProperties": true,
            "type": "object"
          },
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Frame Comments"
    },
    "general_comments": {
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
      "title": "General Comments"
    },
    "storyboard_name": {
      "default": "",
      "title": "Storyboard Name",
      "type": "string"
    },
    "allow_structure": {
      "default": true,
      "title": "Allow Structure",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id",
    "job_id"
  ],
  "title": "apply_client_commentsArguments",
  "type": "object"
}
```

## approve_duo_gate

Approve a duo ad waiting at a review gate (created with auto_approve
false). Look at outputs.character_url / outputs.videos first.

Args:
job_id: The duo job.
brand_id: Its brand UUID.
gate: "character" (the cast) or "frames" (the opening frames) — the
outputs.gate get_flow_status reports.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "gate": {
      "title": "Gate",
      "type": "string"
    }
  },
  "required": [
    "job_id",
    "brand_id",
    "gate"
  ],
  "title": "approve_duo_gateArguments",
  "type": "object"
}
```

## create_ad_from_website

Generates an ad storyboard from nothing but a website URL.

Runs the whole sequence server-side: finds or creates the brand, extracts
brand DNA and the product catalog from the site, picks and analyzes the
best-selling product, then generates a one-storyboard video ad.

Use this when you only have a website (e.g. a prospect's domain). When you
already know the brand and want to choose the product yourself, use
list_brands / list_products / create_video_ad instead.

Args:
website: The brand's website, e.g. "acme.com" or "https://acme.com".
prompt: Creative brief. Strongly recommended — omitting it falls back to
a generic UGC testimonial brief, which produces generic creative.
name: Brand name to use if the brand doesn't exist yet. Defaults to a
name derived from the domain; website onboarding fills in the rest.
product_id: Pin a specific product. Omit to auto-pick the best seller.
Errors if the id isn't in the brand's catalog.
aspect_ratio: "9:16" (default), "16:9", or "1:1".
style: "directed" (default) — a creative director first writes a
treatment from the brand's DNA: one specific person, a brand-native
location, explicit camera and colour grade; the storyboard is
rendered to it. "ugc" — the plain phone-shot creator look.

Returns immediately with a job_id; poll get_website_ad_status. The full run
takes roughly 5-10 minutes.

Input schema:

```json
{
  "properties": {
    "website": {
      "title": "Website",
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
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
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
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "style": {
      "default": "directed",
      "title": "Style",
      "type": "string"
    }
  },
  "required": [
    "website"
  ],
  "title": "create_ad_from_websiteArguments",
  "type": "object"
}
```

## create_animated_ad

Create an animated video ad: story → cast → keyframes → voiced clips.

Args:
brand_id: Brand UUID (from list_brands).
brief: The creative brief, in the client's words — it drives the story.
name: Optional job name (the pipeline renames it to the story's title).
aspect_ratio: "9:16" (default), "16:9" or "1:1".
segment_count: Scenes, 1-10. Omit to let the story decide (3-6).
art_style: claymation | papercraft | 3d_pixar | 2d_vector | anime.
story_concept: anthro_drama | animal_buddies | mascot_hero.
product_id: Product to feature (analyzed first if needed).
reference_video_url: Recreate this existing video in animated style
(https). Can't be combined with segment_count, art_style,
story_concept or characters.
character_description: A sentence about the main character.
characters: Up to 3 locked cast members: [{image_url (https), name?,
gender? male|female|neutral, description?}].
audio_mode: "speech" (characters talk, default), "generated_music"
(wordless clips, no soundtrack) or "sung_music" (wordless clips
with the script SUNG as the soundtrack — use it when the client
wants a jingle / song / their script sung). With sung_music,
get_flow_status shows stage "generating_music" until the song is
ready and outputs.music carries it; finalize_video lays it under
the cut.

Returns {job_id, flow: "animated", status: "processing"}. Takes ~15-30 min.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "title": "Brief",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
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
    "art_style": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Art Style"
    },
    "story_concept": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Story Concept"
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
    "reference_video_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Reference Video Url"
    },
    "character_description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Character Description"
    },
    "characters": {
      "anyOf": [
        {
          "items": {
            "additionalProperties": true,
            "type": "object"
          },
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Characters"
    },
    "audio_mode": {
      "default": "speech",
      "title": "Audio Mode",
      "type": "string"
    }
  },
  "required": [
    "brand_id",
    "brief"
  ],
  "title": "create_animated_adArguments",
  "type": "object"
}
```

## create_avatar

Generate a new avatar (a reusable on-camera person) for a brand.

Args:
brand_id: Brand UUID.
prompt: Who they are — look, age, vibe ("late-20s runner, freckles,
warm and direct").
name: Optional display name.
style: Optional avatar style id.

Synchronous (~30-60s). Returns {avatar_id, name, image_url, persona, ...}.

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
    "name": {
      "default": "",
      "title": "Name",
      "type": "string"
    },
    "style": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Style"
    }
  },
  "required": [
    "brand_id",
    "prompt"
  ],
  "title": "create_avatarArguments",
  "type": "object"
}
```

## create_brand

Creates a new brand for the authenticated user.

Call list_brands FIRST and reuse an existing brand_id when one matches the
user's wording — only create a brand when none exists yet. Returns the new
brand_id, which you can pass straight to create_video_ad.

Args:
name: Brand name (required), e.g. "Acme Coffee".
description: Short description of the brand/business.
website: The brand's website URL or domain, e.g. "acme.com".
industry: Industry/vertical, e.g. "DTC coffee subscription".
logo_url: URL of the brand's logo image, if known.
sample_member_emails: Restrict the sample team-share to these member
emails (the editors who work on samples). Absent = whole team.
sample_member_ids: Same restriction by member user id (OR-matched).

Input schema:

```json
{
  "properties": {
    "name": {
      "title": "Name",
      "type": "string"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Description"
    },
    "website": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Website"
    },
    "industry": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Industry"
    },
    "logo_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Logo Url"
    },
    "sample_member_emails": {
      "anyOf": [
        {
          "items": {},
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Sample Member Emails"
    },
    "sample_member_ids": {
      "anyOf": [
        {
          "items": {},
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Sample Member Ids"
    }
  },
  "required": [
    "name"
  ],
  "title": "create_brandArguments",
  "type": "object"
}
```

## create_broll_ad

Create a b-roll video ad: product scenes cut together under a voiceover.

Args:
brand_id: Brand UUID. The brand needs at least one product.
brief: The creative brief, in the client's words — it steers the
script and the shot list.
name: Optional job name.
product_id: Product to feature; omit for the brand's best seller.
segment_count: Scenes, ~4s each (2-20, default 6).
aspect_ratio: "9:16" (default), "16:9" or "4:5".
video_model: Clip model; omit for the brand's b-roll default.
voice_id: ElevenLabs voice; omit for the narrator the dashboard's Auto
voice would cast.

Returns {job_id, flow: "b-roll", status: "processing"}. Takes ~20-40 min;
the finished cut is recorded as the final video automatically.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "title": "Brief",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
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
    "segment_count": {
      "default": 6,
      "title": "Segment Count",
      "type": "integer"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "video_model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Video Model"
    },
    "voice_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Voice Id"
    }
  },
  "required": [
    "brand_id",
    "brief"
  ],
  "title": "create_broll_adArguments",
  "type": "object"
}
```

## create_duo_ad

Create a duo ad: two people talking about the product.

Args:
brand_id: Brand UUID.
brief: What the conversation is about, in the client's words. At least
one of brief, reference_video_url or product_id is needed.
name: Optional job name.
count: 1-4 different conversations (combined into one cut).
with_speech: Spoken dialogue (default) or silent.
want_captions: Burn captions into the cut (default true).
reference_video_url: Recreate this video's conversation (https).
product_id: Product to feature.
auto_approve: Pass the cast and frame gates automatically (default).
False stops at each for approve_duo_gate (status awaiting_input).

Returns {job_id, flow: "duo", status: "processing", auto_approve}.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Brief"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
    },
    "count": {
      "default": 1,
      "title": "Count",
      "type": "integer"
    },
    "with_speech": {
      "default": true,
      "title": "With Speech",
      "type": "boolean"
    },
    "want_captions": {
      "default": true,
      "title": "Want Captions",
      "type": "boolean"
    },
    "reference_video_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Reference Video Url"
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
    "auto_approve": {
      "default": true,
      "title": "Auto Approve",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id"
  ],
  "title": "create_duo_adArguments",
  "type": "object"
}
```

## create_freestyle_ad

Makes a video-ad storyboard from a free-form brief plus any images —
no format to choose, nothing to label. The director decides the concept,
scene count, script and presenter from the brief ("give me the best ad for
this product" is a valid brief).

Pass every image the user gave you in `images`, unsorted: product photos,
photos of a person who should appear, moodboards/style references, and
product PAGE links (a shop's product URL). The backend works out which is
which — product → the ad's product, person → the on-camera presenter,
everything else → style references — and imports product pages (name,
photos, analysis) into the brand's product library. Links pasted in the
prompt are picked up too. The response's `assets` says what each image
was taken to be; relay it to the user.

Args:
prompt: The creative brief, in the user's words.
images: Image URLs, `data:image/...;base64,` URIs, or product-page
URLs, in any order (max 20 images + 3 product pages).
brand_id: Optional. Omit it — the brand is taken from a product page's
website or the user's only brand, and a new brand is created when
the user has none. If the response has status "needs_brand", pick
one of the listed brands from the user's wording (or ask) and call
again with that brand_id.

Returns immediately with a job_id; poll get_freestyle_status (~3-6 min).

Input schema:

```json
{
  "properties": {
    "prompt": {
      "title": "Prompt",
      "type": "string"
    },
    "images": {
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
      "title": "Images"
    },
    "brand_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Brand Id"
    }
  },
  "required": [
    "prompt"
  ],
  "title": "create_freestyle_adArguments",
  "type": "object"
}
```

## create_motion_ad

Create a motion-graphics brand film (designed type, shapes and motion —
no actors).

Args:
brand_id: Brand UUID.
brief: What the film must say, in the client's words (max 8000 chars).
name: Optional job name.
aspect_ratio: "9:16" (default), "1:1" or "16:9".
duration: Seconds: 6, 10, 15 (default), 20, 30, 45 or 60.
num_variations: 1-3 different films from the same brief.
angle: pain-denial (default) | before-after | feature-tour | promo.
cta_label: The closing call to action, e.g. "Shop now".
media_urls: Up to 12 images/clips (https) to use in the film.
figures: Real numbers it may show: [{label, value, unit?, source?}].
Only these figures appear — none are invented.
plan: Plan the scenes first and lock the plan into the render.

Returns {job_id, flow: "motion", status, generation_job_ids}.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "title": "Brief",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "duration": {
      "default": 15,
      "title": "Duration",
      "type": "integer"
    },
    "num_variations": {
      "default": 1,
      "title": "Num Variations",
      "type": "integer"
    },
    "angle": {
      "default": "pain-denial",
      "title": "Angle",
      "type": "string"
    },
    "cta_label": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Cta Label"
    },
    "media_urls": {
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
      "title": "Media Urls"
    },
    "figures": {
      "anyOf": [
        {
          "items": {
            "additionalProperties": true,
            "type": "object"
          },
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Figures"
    },
    "plan": {
      "default": false,
      "title": "Plan",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id",
    "brief"
  ],
  "title": "create_motion_adArguments",
  "type": "object"
}
```

## create_multivideo_ads

Create several different UGC storyboards from one brief.

Args:
brand_id: Brand UUID.
brief: The campaign brief, in the client's words; it is split into
num_videos distinct angles.
num_videos: 1-8 storyboards.
product_id: Product to feature.
aspect_ratio: "9:16" (default).
segment_count: Talking scenes per storyboard.
broll_count: B-roll scenes per storyboard.
video_model: Clip model for later renders; omit for the default.

Returns {tracking_id, job_ids, campaign_id, flow: "multivideo", status}.
Poll get_flow_status with job_id = tracking_id; outputs.storyboards lists
each job and how far it got.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "title": "Brief",
      "type": "string"
    },
    "num_videos": {
      "default": 2,
      "title": "Num Videos",
      "type": "integer"
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
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "segment_count": {
      "default": 3,
      "title": "Segment Count",
      "type": "integer"
    },
    "broll_count": {
      "default": 1,
      "title": "Broll Count",
      "type": "integer"
    },
    "video_model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Video Model"
    }
  },
  "required": [
    "brand_id",
    "brief"
  ],
  "title": "create_multivideo_adsArguments",
  "type": "object"
}
```

## create_shorts_ad

Generates a 15-second Shorts-style video ad through the one-shot Shorts
chain: concept → script → character → render → captions + music. The chain
finishes the video itself — no separate edit step. Best for one tight idea
(a gag, a single before/after, a sharp problem-solution beat).

Use list_brands first for brand_id. Pass product_id when the brief was
written around a SPECIFIC product — otherwise the chain picks the best
seller itself, and a brief naming one product can end up rendered on
another.

Args:
brand_id: Brand UUID (from list_brands / create_brand).
prompt: The creative brief — ideally the full one-paragraph shorts
prompt (global style line + four timed shot blocks + audio line),
but any brief works.
no_product: True when the brand sells a SERVICE (nothing physical to
show) — the subject becomes the brand's service plus the brief.
model: Video engine (seedance mini | fast | full, kling-v3-pro, veo3).
Omit for the default tier (Seedance mini).
aspect_ratio: "9:16" (default), "1:1", or "16:9".
name: Optional job name shown in the dashboard.
product_id: Product UUID to feature (the one the brief is about);
omit to auto-pick the best seller.
voice_id: ElevenLabs voice id, or "auto"; omit for the video model's
own voice.
want_music: Add a music bed (default true).
creative_mode: The dashboard's creative mode; omit for "auto".
reference_video_url: Recreate this video's idea for the brand (https).
keep_reference_audio: Keep the reference video's audio.
image_model: Image model for the opening frame; omit for the default.
count: 1-4 takes of the same short (each is a full paid render).

Returns immediately with a job_id; poll get_shorts_status (~5-10 minutes).

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
    "no_product": {
      "default": false,
      "title": "No Product",
      "type": "boolean"
    },
    "model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Model"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
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
    "voice_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Voice Id"
    },
    "want_music": {
      "default": true,
      "title": "Want Music",
      "type": "boolean"
    },
    "creative_mode": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Creative Mode"
    },
    "reference_video_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Reference Video Url"
    },
    "keep_reference_audio": {
      "default": false,
      "title": "Keep Reference Audio",
      "type": "boolean"
    },
    "image_model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Image Model"
    },
    "count": {
      "default": 1,
      "title": "Count",
      "type": "integer"
    }
  },
  "required": [
    "brand_id",
    "prompt"
  ],
  "title": "create_shorts_adArguments",
  "type": "object"
}
```

## create_static_ads

Generate static image ads for a brand.

Args:
brand_id: Brand UUID.
brief: What the ad must say/show, in the client's words.
num_variations: 1-10 images.
aspect_ratio: "4:5" (default), "1:1", "9:16", ...
name: Optional job name.
product_id: Focus on one product.
enrich_brief: Let Claude expand the brief into a creative direction
(default, as the dashboard does). Only the expansion reaches the
image model, so exact copy can drift — set false to send the brief
as written, or keep_brief_verbatim to send both.
keep_brief_verbatim: With enrich_brief, also append the brief word
for word, so exact headlines, prices and "no X" rules survive.
style_reference_urls: Images to take the visual style from.
page_url: A page of the client's site to pull offers/products from.

Returns {job_id, generation_job_ids, partial, requested_count}.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "title": "Brief",
      "type": "string"
    },
    "num_variations": {
      "default": 2,
      "title": "Num Variations",
      "type": "integer"
    },
    "aspect_ratio": {
      "default": "4:5",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
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
    "enrich_brief": {
      "default": true,
      "title": "Enrich Brief",
      "type": "boolean"
    },
    "keep_brief_verbatim": {
      "default": false,
      "title": "Keep Brief Verbatim",
      "type": "boolean"
    },
    "style_reference_urls": {
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
      "title": "Style Reference Urls"
    },
    "page_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Page Url"
    }
  },
  "required": [
    "brand_id",
    "brief"
  ],
  "title": "create_static_adsArguments",
  "type": "object"
}
```

## create_video_ad

Generate an AI video advertisement from a text description.

Recommended flow before calling this:
1. Call list_brands to find the brand_id from the user's wording.
2. Call list_products(brand_id) to find the product the user wants
to feature. Match the user's wording to a returned product name.
If the brand has multiple products and the user was vague, ask
which one. If the user names a product that isn't on the brand,
surface the available options instead of guessing.
3. Briefly confirm the chosen product with the user before calling
this tool — generation takes 2–4 minutes and costs compute.

Args:
brand_id: Brand UUID. Get this from list_brands.
prompt: Natural-language ad description / visual direction (required).
If the user provides exact ad copy, do not rely on this field alone;
pass the exact words via custom_script or custom_script_segments.
product_id: Product UUID to feature. Get from list_products(brand_id).
Optional but strongly recommended — without it, product visuals
are invented from the prompt and tend to be inconsistent.
num_storyboards: How many storyboard variants to generate (1-5, default 1).
aspect_ratio: Video aspect ratio. One of "9:16" (vertical, default), "16:9", "1:1", "4:5".
custom_script: Exact voiceover/copy to use verbatim. Use this whenever
the user pastes a script, says "use this script", "exact script",
"word for word", or gives line-by-line copy. The pipeline will split
it into segments and will not rewrite the wording.
custom_script_segments: Exact pre-split voiceover segments. Prefer this
over custom_script if the user supplied multiple lines/scenes. Each
item is copied verbatim into an A-roll segment.
segment_count: Optional number of A-roll script segments when splitting
custom_script. Ignored when custom_script_segments is provided. If
omitted for an exact script, inferred at roughly 16 words per A-roll
and capped at 4 automatic A-roll segments.
broll_count: Optional number of B-roll visual segments. If omitted, this
is chosen automatically so A-roll + B-roll stays at 8 total segments
or fewer. Explicit user B-roll counts are honored.
style: "ugc" (default) — phone-shot creator look. "directed" — a
creative director first writes a treatment from the brand's DNA
(a specific person, a brand-native location, explicit camera and
colour grade) and the storyboard is rendered to it. Use "directed"
for anything a prospect will see.

Returns immediately with a job_id; actual generation takes 2-4 minutes.
Check the Advertisable dashboard for results.

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
    },
    "style": {
      "default": "ugc",
      "title": "Style",
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

## create_video_ad_v2

Generates a video ad via the staged backend pipeline (V2): finds the
brand's best-selling product, generates UGC scripts, builds the master
script, generates the character, then renders all frames — each stage a
real Advertisable backend call, visible in the dashboard as it progresses.

Use list_brands first for brand_id; products come from brand onboarding
(start_brand_onboarding) — if the brand has analyzed products and
product_id is omitted, the best seller is picked automatically.

Args:
brand_id: Brand UUID (from list_brands / create_brand).
prompt: Creative brief — the scripts and the Creative Strategist work
from it.
product_id: Product UUID to feature; omit to auto-pick the best seller.
segment_count: Number of A-roll scenes with the character (1-4, default 2).
broll_count: Number of B-roll visual segments (0-4, default 1).
aspect_ratio: "9:16" (default), "16:9", or "1:1".
script_segments: VERBATIM spoken script, one string per A-roll segment
in order (first = hook, last carries the CTA). When provided the
pipeline's scriptwriter is skipped and these exact lines are used.
character_description: locked casting block (gender, age, look,
setting) — persisted on the job as character_description, which
the master script uses as the PRIMARY casting source.

Returns immediately with a job_id; poll get_ad_status_v2.

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
    "segment_count": {
      "default": 2,
      "title": "Segment Count",
      "type": "integer"
    },
    "broll_count": {
      "default": 1,
      "title": "Broll Count",
      "type": "integer"
    },
    "aspect_ratio": {
      "default": "9:16",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "script_segments": {
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
      "title": "Script Segments"
    },
    "character_description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Character Description"
    }
  },
  "required": [
    "brand_id",
    "prompt"
  ],
  "title": "create_video_ad_v2Arguments",
  "type": "object"
}
```

## create_video_share

Create a public, shareable VIEW link for a job's finished video
(the /video-preview page). Permanent, no login needed to watch.

Works for every ad type. Pass brand_id: the link is then minted only after
the ad has a final video (b-roll, animated, motion graphics and freestyle
ads get theirs recorded first — see finalize_video), so it never opens on
an empty page.

Args:
job_id: The job whose final video should be shared.
brand_id: Brand UUID the job belongs to (recommended — see above).
role: Kept for compatibility; every link lets signed-in clients comment.

Returns {share_token, url} — send `url`, never the raw video file.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "default": "",
      "title": "Brand Id",
      "type": "string"
    },
    "role": {
      "default": "viewer",
      "title": "Role",
      "type": "string"
    }
  },
  "required": [
    "job_id"
  ],
  "title": "create_video_shareArguments",
  "type": "object"
}
```

## edit_frames

Change something in existing frames' pictures, keeping everything else.

The storyboard's Edit Image: the current frame is the base image and only the
described change is made — the person, their face, hair and clothes stay the
same unless the change says otherwise.

Args:
brand_id: Brand UUID.
job_id: The storyboard job.
edits: One per frame: {segment_id, change, include_product?,
comment_id?}. `change` is what to change, in plain words ("add the
output cable on the left side", "make the pedal about 10% smaller").
comment_id is the client comment being acted on (from
list_client_comments) — ALWAYS pass it for client feedback: the
edit then starts from the exact version the client reviewed, and
`change` may be omitted to use their words verbatim. include_product
also hands the model the product's own photos — use it when the
note is about how the product looks.

Returns {"edited": N, "of": M, "segments": [{segment_id, success, error,
s3_url, before_url, before_version_index, after_version_index,
base_version_index, base_source, exact, mode}]}. base_source "comment"
means the reviewed version was the base; exact false means it could not
be pinned (an old comment, or freestyle, which can only redraw: mode
"redraw").

Use this for a note about a frame that already has a picture. Use
regenerate_frames only to draw a frame that has none — drawing again from
the description invents a new person unless a character was saved.

Waits for the edits (up to 5 minutes). One frame failing does not abandon
the others.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "edits": {
      "items": {},
      "title": "Edits",
      "type": "array"
    }
  },
  "required": [
    "brand_id",
    "job_id",
    "edits"
  ],
  "title": "edit_framesArguments",
  "type": "object"
}
```

## edit_motion_film

Change a finished motion film — the exact one the client reviewed.

Args:
job_id: The motion job.
brand_id: Its brand UUID.
instruction: What to change — the client's comment verbatim (max 1000
chars).
variation: Which film (1, 2, 3). Omit for the latest.
mp4_s3_url: The exact film the client watched (any form of its URL,
from get_flow_status outputs.films or previous_films). Wins over
variation — use it whenever the client reviewed a specific cut.

Returns {generation_id, segment_id, variation, edited_film, replaced_film,
status: "processing"}. Poll get_flow_status(flow="motion"); the replaced
film stays in outputs.previous_films. After it completes, finalize_video
again so the final video is the edited film.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "instruction": {
      "title": "Instruction",
      "type": "string"
    },
    "variation": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Variation"
    },
    "mp4_s3_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Mp4 S3 Url"
    }
  },
  "required": [
    "job_id",
    "brand_id",
    "instruction"
  ],
  "title": "edit_motion_filmArguments",
  "type": "object"
}
```

## finalize_video

Record the final video of a finished b-roll, animated, motion graphics,
freestyle or greenscreen ad, so it can be shared and downloaded.

Call it once the ad's status tool reports completed (and again after a
revision re-renders something — it re-records the newest cut). For UGC use
generate_full_video instead; shorts and duo record their final video
themselves.

Args:
job_id: The ad's job_id.
brand_id: The brand UUID the job belongs to.
video_url: Optional — an exact video to record as final (e.g. the cut
the client approved). Omit to use the ad's own finished video.
variation: Motion graphics only — which variation (1, 2, 3) is final.
base_cut: A client revision — the cut the client reviewed (the
reviewed_cut from get_reviewed_cut). With replace, that cut is
rebuilt with only those segments swapped; alone, it is put back as
the final.
replace: {segment_id: new clip video_url} — the segments the client's
notes changed (each must be a finished video of that segment).

Returns {video_url, source}: source is "flow" (the ad's own cut),
"combined" (clips cut together), "given", "existing", "rebuilt" (base_cut
with replacements) or "restored" (base_cut put back).

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "video_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Video Url"
    },
    "variation": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Variation"
    },
    "base_cut": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Base Cut"
    },
    "replace": {
      "anyOf": [
        {
          "additionalProperties": {
            "type": "string"
          },
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Replace"
    }
  },
  "required": [
    "job_id",
    "brand_id"
  ],
  "title": "finalize_videoArguments",
  "type": "object"
}
```

## generate_carousel

Generates a multi-slide carousel for a brand: an Instagram carousel AD, or a
LinkedIn DOCUMENT for a person's own profile (a post: no CTA, no product, the
exact copy typeset over wordless on-brand visuals, up to 8 slides).

`mode`: "ad", "post", or "auto" (default) — auto reads the brief: a brief that
says "my LinkedIn post", "what I learned", "no CTA" is a post; one that names
an offer, discount or "shop now" is an ad; otherwise a quick classifier
decides and the answer comes back as `mode_detection`. Pass the mode when you
know it. Poll get_carousel_status for the slides and the PDF.

Post mode extras: `direction` — the art direction every slide's picture
follows (medium, palette, lighting, motif, mood, composition; never words to
draw); `slides` — the exact copy per slide as {role, headline, subhead} (role
hook | point | takeaway); when set the planner is skipped and these words are
typeset over the pictures. `model` — image model id override.

Writes the whole carousel as one narrative (shared style, recurring motif),
renders slide 1 as the anchor, then generates the rest to match it. Creates
the job for you — you only need the brand.

`brief` is what the carousel should say. `archetype` is the narrative shape —
leave it unset and the best fit is picked from the brief; or pin one of:
listicle, us_vs_them, paso, before_after, myth_fact, feature_tour,
testimonial_stack, custom. Defaults to 3 slides at 4:5 (Instagram feed).
Slides render asynchronously (~1-3 min); the returned job_id is where a human
watches them appear.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "brief": {
      "title": "Brief",
      "type": "string"
    },
    "archetype": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Archetype"
    },
    "slide_count": {
      "default": 3,
      "title": "Slide Count",
      "type": "integer"
    },
    "aspect_ratio": {
      "default": "4:5",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
    },
    "mode": {
      "default": "auto",
      "title": "Mode",
      "type": "string"
    },
    "direction": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Direction"
    },
    "slides": {
      "anyOf": [
        {
          "items": {},
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Slides"
    },
    "model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Model"
    }
  },
  "required": [
    "brand_id",
    "brief"
  ],
  "title": "generate_carouselArguments",
  "type": "object"
}
```

## generate_freestyle_videos

Render the clips of a finished freestyle storyboard (all scenes, or the
given segment_ids — e.g. one scene after a revision).

Args:
job_id: The freestyle job.
brand_id: Its brand UUID.
video_model: Kling / Seedance / MiniMax model id; omit for the default.
segment_ids: Only these scenes.

Poll get_freestyle_status (videos, video_progress); then finalize_video
cuts the clips together in scene order.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "video_model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Video Model"
    },
    "segment_ids": {
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
      "title": "Segment Ids"
    }
  },
  "required": [
    "job_id",
    "brand_id"
  ],
  "title": "generate_freestyle_videosArguments",
  "type": "object"
}
```

## generate_full_video

Make the final video of an ad. Call this when the user says "create the
final video", "make the video" or "I'm feeling lucky" — for any ad type.

UGC video ads and recreates: renders every clip that isn't rendered yet and
runs the dashboard's "I'm Feeling Lucky" edit (silence-trim A-rolls,
combine in order, overlay B-rolls, transitions). Freestyle: renders the
clips, then joins them in scene order. Animated, b-roll, motion, duo and
shorts made their video themselves — this records it as the final.
Statics and carousels are pictures and have no video.

The storyboard's frames must be finished first. Rendering clips is the
paid step (billed per second of video); a clip that is already rendered is
never rendered again.

Args:
brand_id: Brand UUID.
job_id: The ad's job (the storyboard's job_id).
model: Clip model for clips still to render. Omit for the default —
Kling 3.0 for UGC / recreate, the job's own model for freestyle.
Others: veo3, seedance-2.0, grok.
apply_transitions: UGC / recreate — transitions between A-rolls
(default true).
lucky_v2: UGC / recreate — the server-side v2 auto-edit (phrase-beat
jump cuts, punch-ins, beat-aligned b-roll, overlay assets, music
bed) instead of the classic edit. Falls back to the classic edit.
force: UGC / recreate — cut the final video again even if one exists
(after client revisions the clips are new and the old cut is
stale). Rendered clips are not rendered again; only the edit runs.

Returns at once ({status: processing | completed, final_video_url}); the
card follows the run to the final video (~5-15 minutes when clips render).

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Model"
    },
    "apply_transitions": {
      "default": true,
      "title": "Apply Transitions",
      "type": "boolean"
    },
    "lucky_v2": {
      "default": false,
      "title": "Lucky V2",
      "type": "boolean"
    },
    "force": {
      "default": false,
      "title": "Force",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id",
    "job_id"
  ],
  "title": "generate_full_videoArguments",
  "type": "object"
}
```

## generate_post_visual

Renders the on-brand visual for a founder's own LinkedIn post (not an ad):
a quote card, a document (carousel PDF) or a short clip.

The post's text is yours; pass its beats and this renders them with the
brand's colours, type and logo — no product, no CTA. Typeset (default) is
pure typography on the brand's surfaces, exact words, seconds. Painted
(quote card) has an image model paint a picture from your `direction`
first, then sets the same type over it; billed as one image.

Args:
brand_id: Brand UUID (from list_brands / create_brand).
kind: "quote_card" (one image: the hook), "document" (slides + PDF: hook,
one per point, takeaway) or "clip" (15–30s MP4 of the same beats).
hook: The post's first line, under ~12 words. Becomes the headline.
points: For document/clip: 2–8 items, each a string or {title, body}.
takeaway: Optional closing line (the one thing the reader keeps).
subline: Optional second line under the hook.
attribution: Optional {name, role, handle} shown small at the bottom.
aspect_ratio: "4:5" (default, LinkedIn feed), "1:1" or "9:16".
duration: Clip only: 15, 20, 25 or 30 seconds.
register: "light", "dark" or "auto" (the brand's own).
name: Optional job name shown in the dashboard.
style: "typeset" (default) or "painted" (quote card only; a document is
painted through generate_carousel in post mode with a direction).
direction: Painted only: the art direction — medium, palette, lighting,
motif, mood, composition. Never words to draw; the copy is typeset.
model: Painted only: image model id (e.g. "gpt-image-2",
"gemini-3.1-flash-image"). Unset = the brand's statics model.

Returns a job_id to poll with get_post_visual_status.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "kind": {
      "title": "Kind",
      "type": "string"
    },
    "hook": {
      "title": "Hook",
      "type": "string"
    },
    "points": {
      "anyOf": [
        {
          "items": {},
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Points"
    },
    "takeaway": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Takeaway"
    },
    "subline": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Subline"
    },
    "attribution": {
      "anyOf": [
        {
          "additionalProperties": true,
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Attribution"
    },
    "aspect_ratio": {
      "default": "4:5",
      "title": "Aspect Ratio",
      "type": "string"
    },
    "duration": {
      "default": 20,
      "title": "Duration",
      "type": "integer"
    },
    "register": {
      "default": "auto",
      "title": "Register",
      "type": "string"
    },
    "name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Name"
    },
    "style": {
      "default": "typeset",
      "title": "Style",
      "type": "string"
    },
    "direction": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Direction"
    },
    "model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Model"
    }
  },
  "required": [
    "brand_id",
    "kind",
    "hook"
  ],
  "title": "generate_post_visualArguments",
  "type": "object"
}
```

## generate_segment_videos

Render video for specific frames of a storyboard.

Args:
brand_id: Brand UUID.
job_id: The storyboard job.
segment_ids: The frames to render. Omit to render every frame.
model: Video model (default veo3).
also_render_missing: additionally render every frame in the script that
has no video yet. Use this after a revision, so the client is sent a
complete film: the frames they commented on are re-rendered because
their video is now of a picture that no longer exists, and the
frames that were never rendered get their first video. Frames that
already have a video and were not touched are left alone.

Returns {"rendered": N, "of": M, "segments": [{segment_id, success, error}]},
plus "rendered_missing" naming the frames that were rendered because they
had no video rather than because the client asked for a change.

Use this after applying a client's feedback. Re-rendering a whole storyboard
to fix one frame costs as many renders as it has frames and churns the ones
the client had already accepted.

Use generate_full_video instead when you want the finished, auto-edited
film — a first cut, or a final pass once the frames are settled.

One frame failing does not abandon the others; each result says which.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "segment_ids": {
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
      "title": "Segment Ids"
    },
    "model": {
      "default": "veo3",
      "title": "Model",
      "type": "string"
    },
    "also_render_missing": {
      "default": false,
      "title": "Also Render Missing",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id",
    "job_id"
  ],
  "title": "generate_segment_videosArguments",
  "type": "object"
}
```

## get_ad_status

Get the current status of a video ad generation job.

Renders as the ad card in Claude.ai: the storyboard, the final video once
made, and the storyboard / preview links (also in the text).

Args:
job_id: The adbot_job_id returned by create_video_ad.

Returns the job's status, progress, storyboard details, and (when complete)
references to the generated frames/videos.

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

## get_ad_status_v2

Status of a create_video_ad_v2 job: current stage (scripts /
master_script / characters / frames_generating), per-frame progress, and
artifact URLs (characters + completed frames).

Args:
job_id: The job_id returned by create_video_ad_v2.
brand_id: The brand UUID — pass it when available (required if the
server restarted since the job started).

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Brand Id"
    }
  },
  "required": [
    "job_id"
  ],
  "title": "get_ad_status_v2Arguments",
  "type": "object"
}
```

## get_brand_dna

The brand's creative research pack ("brand DNA" for ad creation):
brand summary, audience + pain points, voice, proof points, allowed and
banned claims, winning angle patterns for the category, example hook
lines, and the presenter persona this customer trusts.

Generated on first call (takes ~20-60s) and cached per brand; later
calls are instant. Ground every script and creative brief in this —
never invent claims it does not support.

Args:
brand_id: Brand UUID (from list_brands / create_brand).
refresh: Force a rebuild even when a fresh pack is cached (e.g. the
catalog just changed).

Returns {success, research: {...}, cached, updated_at}.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "refresh": {
      "default": false,
      "title": "Refresh",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id"
  ],
  "title": "get_brand_dnaArguments",
  "type": "object"
}
```

## get_carousel_status

Status and files of a carousel started with generate_carousel (ad or post).

Returns status (generating | partial | done | failed), the slides in order
with presigned image links, and for a finished set the PDF (bound on first
call) — the file LinkedIn takes for a document post. Links expire; fetch
again later.

Args:
job_id: The job_id returned by generate_carousel.

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
  "title": "get_carousel_statusArguments",
  "type": "object"
}
```

## get_flow_status

Status of an ad started with create_broll_ad, create_animated_ad,
create_motion_ad, create_duo_ad, create_multivideo_ads, create_static_ads
or generate_carousel.

Args:
flow: "b-roll", "animated", "motion", "duo", "multivideo", "statics"
or "carousel" — the `flow` the create tool returned.
job_id: The job_id the create tool returned (multivideo: its
tracking_id).
brand_id: The brand UUID the ad was created for.

Returns {status, stage, progress: {done, total} | null, error, outputs}.
status: "processing" (keep polling), "completed", "failed" (error says
why), or "awaiting_input" (a review gate — the response says what is
needed). outputs carry the flow's results: video_url, clips, frames,
films, storyboards. Once completed, finalize_video records the final
video (where the flow didn't) and create_video_share links it.

Input schema:

```json
{
  "properties": {
    "flow": {
      "title": "Flow",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    }
  },
  "required": [
    "flow",
    "job_id",
    "brand_id"
  ],
  "title": "get_flow_statusArguments",
  "type": "object"
}
```

## get_freestyle_status

Status of a create_freestyle_ad job: {status, stage, error, progress,
frames, assets}. status 'done' means every storyboard frame is ready
(frames[].image_url); 'failed' carries the error; anything else = still
running (stage: script → master_script → directing → character → frames).

Args:
job_id: The job_id returned by create_freestyle_ad.
brand_id: The brand_id returned by create_freestyle_ad.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    }
  },
  "required": [
    "job_id",
    "brand_id"
  ],
  "title": "get_freestyle_statusArguments",
  "type": "object"
}
```

## get_full_video_status

Where an ad's final video is: status processing | completed | failed |
not_started (no final video run — call generate_full_video), the stage,
and final_video_url when it is done. Works for every ad type.

Args:
job_id: The job_id passed to generate_full_video.
brand_id: Brand UUID — optional; the job's own brand is used.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Brand Id"
    }
  },
  "required": [
    "job_id"
  ],
  "title": "get_full_video_statusArguments",
  "type": "object"
}
```

## get_post_visual_status

Status and files of a founder post visual started with generate_post_visual.

Returns status (generating | done | failed) and, when done, presigned
links: image_url (quote card, or the first slide / clip poster), slide_urls
and pdf_url (document), video_url (clip). Links expire; fetch again later.

Args:
job_id: The job_id returned by generate_post_visual.

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
  "title": "get_post_visual_statusArguments",
  "type": "object"
}
```

## get_reviewed_cut

Find the cut a client reviewed and the segment their video note is about.

Args:
job_id: The ad's job_id.
brand_id: The brand UUID the job belongs to.
comment_id: A video comment (from list_client_comments video_comments)
— its cut and timestamp are used. Or give video_url +
timestamp_seconds instead.
video_url: The cut they watched.
timestamp_seconds: Where in it.

Returns {current_final, reviewed_cut: {video_url, clips: [{segment_id,
video_url, start_sec, end_sec}]} | null, reviewed_is_current, segment
(the clip playing at the timestamp) | null, cuts: [...every recorded
final]}. reviewed_cut null means the backend has no record of that cut
(UGC finals come from generate_full_video and are not recorded) — then
revise against the current video and say so.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "comment_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Comment Id"
    },
    "video_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Video Url"
    },
    "timestamp_seconds": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Timestamp Seconds"
    }
  },
  "required": [
    "job_id",
    "brand_id"
  ],
  "title": "get_reviewed_cutArguments",
  "type": "object"
}
```

## get_shorts_status

Status of a create_shorts_ad job: {status, stage, error, video_url,
take_urls}. status 'done' with a video_url means the finished (captioned)
ad is ready; 'failed' carries the error; anything else = still running.

Args:
job_id: The job_id returned by create_shorts_ad.
brand_id: The brand UUID the job was started for (required).

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    }
  },
  "required": [
    "job_id",
    "brand_id"
  ],
  "title": "get_shorts_statusArguments",
  "type": "object"
}
```

## get_wallet_balance

Returns the authenticated user's current wallet balance.

Call this when the user asks about credits, before kicking off a paid
generation, or after an `insufficient credits` error so you can quote
the exact shortfall.

Returns:
- available_micro / available_usd: spendable balance
- paid_micro / paid_usd: total funded amount
- reserved_micro / reserved_usd: held by in-flight reservations
- status: 'active' | 'frozen' | 'closed'

Amounts are in micro-USD (1,000,000 µ = $1). The *_usd fields are
pre-formatted strings (e.g. "12.50") for direct surfacing to the user.

Input schema:

```json
{
  "properties": {},
  "title": "get_wallet_balanceArguments",
  "type": "object"
}
```

## get_website_ad_status

Status of a create_ad_from_website run.

Reports which phase the run is in (brand / onboarding / catalog / analyzing
/ generating / completed) and, once the storyboard exists, the generated
frames plus `storyboard_url`.

`storyboard_url` is a public page that opens with no account and does not
expire — that is the link to send to a prospect. The frame URLs alongside it
are direct images that expire in about an hour; use them only if you need
the raw files.

Note `catalog_empty`: true means the website had no extractable products, so
product visuals were generated from the prompt alone. Worth a human check
before that storyboard reaches a prospect.

Args:
job_id: The job_id returned by create_ad_from_website.

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
  "title": "get_website_ad_statusArguments",
  "type": "object"
}
```

## list_avatars

The brand's avatars: {avatars: [{avatar_id, name, image_url, persona,
voice_name}], next_cursor}. Pass next_cursor back for the next page.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "limit": {
      "default": 24,
      "title": "Limit",
      "type": "integer"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Cursor"
    }
  },
  "required": [
    "brand_id"
  ],
  "title": "list_avatarsArguments",
  "type": "object"
}
```

## list_brands

Lists all brands belonging to the authenticated user.

Returns a list of brands with their IDs and names. Call this first when the
user mentions a brand by name (e.g. 'my wine brand') to find the matching
brand_id, then pass that brand_id to create_video_ad.

Input schema:

```json
{
  "properties": {},
  "title": "list_brandsArguments",
  "type": "object"
}
```

## list_client_comments

Read the client's unresolved feedback on a brand's storyboards.

Args:
brand_id: Brand UUID. Get from list_brands.
include_waiting: also return items where we are done and the client has
not replied (nothing to action — use it to chase, not to edit).

Returns {"storyboards": [...], "count": N}. Each storyboard carries:
- job_id, name, status ("changes_needed" is the one that needs work), url
- frame_comments: [{comment_id, segment_id, text, kind, reviewed_version?,
pin?}] — the client's words and the EXACT frame they were left on.
segment_id is what update_segment and apply_client_comments take.
reviewed_version is the picture they were looking at: pass comment_id
to edit_frames and the change is made on that version, not on a newer
one. kind "script_edit" is applied by resolving the comment, not by
editing anything.
- general_comments: [{comment_id, text}] — notes about the whole storyboard.
- video_comments: [{comment_id, text, timestamp_seconds, reviewed_cut}] —
notes on a finished video (timestamp -1 = about the whole video).
get_reviewed_cut tells which segment of the cut they watched it was.

Quote the client verbatim when acting on these. "This box is too small.
12.5" wide x 10.5" deep x 4" tall" carries dimensions a paraphrase loses,
and the client will simply write the note again.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "include_waiting": {
      "default": false,
      "title": "Include Waiting",
      "type": "boolean"
    }
  },
  "required": [
    "brand_id"
  ],
  "title": "list_client_commentsArguments",
  "type": "object"
}
```

## list_products

Lists all products for a brand.

Call this after list_brands when the user wants an ad for a specific
product. Match the user's wording to a returned product name and pass
that product_id to create_video_ad.

If the brand has no products, the list is empty — tell the user and
offer to generate without product context (less consistent visuals).

If the user names a product that doesn't appear in the list, surface
the available options instead of guessing.

Products with analyzed=false came straight from the website catalog and
haven't been AI-analyzed yet — call analyze_product on them before
passing them to create_video_ad / create_video_ad_v2.

Args:
brand_id: Brand UUID. Get this from list_brands.

Returns:
{"products": [{"product_id", "name", "description", "product_page_url", "analyzed"}]}

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

## list_recent_ads

List recent video ad jobs for a brand, newest-first.

Args:
brand_id: Brand UUID. Get from list_brands.
limit: Max number of jobs to return (default 20).

Returns {"jobs": [...], "count": N}. Each job includes adbot_job_id, status,
prompt, created_at, etc. Use get_ad_status for full details on a specific job.

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

## ping

Connection check. Returns the authenticated user's id and the server version.

Use this to confirm the integration is working.

Input schema:

```json
{
  "properties": {},
  "title": "pingArguments",
  "type": "object"
}
```

## recreate_video

Recreate a reference video as a new ad, shot-for-shot.

Use this when the user shows you a video they want to "make their own
version of," "redo for their brand," or "recreate." The pipeline
analyzes the reference's shot composition, timing, and style, then
generates a fresh master script tailored to the user's brand/product.

Distinct from `regenerate_variation`, which only reuses an existing
AdBot job's master_script. Use `recreate_video` for any external
reference URL.

Recommended flow:
1. Call list_brands to find brand_id from the user's wording.
2. Optionally call list_products(brand_id) to pick a product to feature.
3. Confirm the reference URL with the user (must be a direct HTTPS link
to a video file, not a YouTube/TikTok page URL).
4. Briefly confirm before calling — generation takes 2-4 minutes and
costs compute.

Args:
brand_id: Brand UUID. From list_brands.
reference_video_url: URL to the source video. Both direct HTTPS file
links (S3, CDN) and social-platform URLs (YouTube, TikTok,
Instagram, X/Twitter, Facebook) work — the worker auto-downloads
social URLs via yt-dlp. Plain page URLs (e.g. a blog post that
embeds a video) won't work; pass the direct video link.
prompt: Optional extra creative direction (e.g. "but make it more
cheerful"). Layered on top of the reference video's analyzed
style.
product_id: Optional product UUID. From list_products(brand_id).
Strongly recommended; without it visuals drift.
num_storyboards: 1–5, default 1.
aspect_ratio: "9:16" (default), "16:9", "4:5".

Returns immediately with a job_id; generation takes 2–4 minutes.
The Claude.ai widget will show storyboard tiles auto-refreshing
every 15s until complete.

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

## regenerate_carousel_slide

Redraw one carousel slide, optionally with new copy (only the fields
given change; the rest of the slide's copy stays).

Args:
job_id: The carousel job (from generate_carousel).
brand_id: Its brand UUID.
slide_number: 1-based slide.
headline / subhead / cta: New copy for that slide.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "slide_number": {
      "title": "Slide Number",
      "type": "integer"
    },
    "headline": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Headline"
    },
    "subhead": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Subhead"
    },
    "cta": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Cta"
    }
  },
  "required": [
    "job_id",
    "brand_id",
    "slide_number"
  ],
  "title": "regenerate_carousel_slideArguments",
  "type": "object"
}
```

## regenerate_frames

Redraw the picture for specific frames of a storyboard.

Args:
brand_id: Brand UUID.
job_id: The storyboard job.
segment_ids: Which frames to redraw. Omit to redraw every frame.

Returns {"regenerated": N, "of": M, "segments": [{segment_id, success, error,
s3_url, before_url, before_version_index, after_version_index}]}.

Use this after changing a frame's image_description. Most client feedback is
about the PICTURE — "this box is too small", "not our teas", "no logo on the
inside" — and editing the script does not change an image. The image changes
when the frame is drawn again.

Order matters: apply_client_comments first (which updates the description
and saves it), then this, then generate_segment_videos. Rendering video
before the frame is redrawn produces a film of the picture the client
complained about.

One frame failing does not abandon the others; each result says which.
Segment ids that are not in the current script come back under
"not_in_script" rather than being silently ignored — after a restructure the
ids a client commented on may no longer exist.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "segment_ids": {
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
      "title": "Segment Ids"
    }
  },
  "required": [
    "brand_id",
    "job_id"
  ],
  "title": "regenerate_framesArguments",
  "type": "object"
}
```

## regenerate_variation

Generate a new variation of an existing video ad.

Args:
source_job_id: adbot_job_id of the source ad to base this variation on.
keep_character: Reuse the original character (default True).
keep_location: Reuse the original location (default True).

Returns immediately with a new job_id; generation takes 2-4 minutes.
Use get_ad_status to check progress.

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

## retry_static_ad

Redraw one static variation (outputs.images[].segment_id from
get_flow_status). Note: a retry re-expands the stored brief, so it does not
carry keep_brief_verbatim.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "segment_id": {
      "title": "Segment Id",
      "type": "string"
    }
  },
  "required": [
    "job_id",
    "brand_id",
    "segment_id"
  ],
  "title": "retry_static_adArguments",
  "type": "object"
}
```

## revise_short

Revise a finished short with the client's feedback.

This is a FULL regeneration, not an edit: every take is rendered and
finished again with the feedback applied — it costs what a new short
costs, and details nobody asked to change can come out differently. Tell
the client that before running it. Refused while the short is still
rendering.

Args:
job_id: The short's job_id.
brand_id: Its brand UUID.
feedback: The client's feedback, verbatim.

Returns {status: "running", full_regeneration: true}; poll get_shorts_status.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "feedback": {
      "title": "Feedback",
      "type": "string"
    }
  },
  "required": [
    "job_id",
    "brand_id",
    "feedback"
  ],
  "title": "revise_shortArguments",
  "type": "object"
}
```

## show_ad

Show an ad: its storyboard (each scene's picture, clip and script line),
the final video once it is made, the dashboard storyboard link and the
client preview link. Works for every ad type.

Use it whenever the user asks to see an ad, asks for its storyboard link,
preview link or final video, or asks where it is.

Args:
job_id: The ad's job id (a storyboard's job_id).
brand_id: Brand UUID — optional; the job's own brand is used.

Input schema:

```json
{
  "properties": {
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "brand_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "default": null,
      "title": "Brand Id"
    }
  },
  "required": [
    "job_id"
  ],
  "title": "show_adArguments",
  "type": "object"
}
```

## start_brand_onboarding

Starts brand onboarding: extracts brand DNA and the product catalog from
the brand's website (Shopify-aware), analyzing each product.

Use after create_brand when list_products(brand_id) is empty. Asynchronous:
returns immediately; poll list_products until products appear (1-3 min),
then pass the chosen product_id to create_video_ad.

Args:
brand_id: Brand UUID (from create_brand or list_brands).
website_url: The brand's website, e.g. "acme.com" or "https://acme.com".

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "website_url": {
      "title": "Website Url",
      "type": "string"
    }
  },
  "required": [
    "brand_id",
    "website_url"
  ],
  "title": "start_brand_onboardingArguments",
  "type": "object"
}
```

## use_avatar

Cast an avatar in a UGC storyboard, before its scripts are written.

Args:
brand_id: Brand UUID.
job_id: A UGC job (create_video_ad_v2 / create_multivideo_ads).
avatar_id: From create_avatar or list_avatars.

Input schema:

```json
{
  "properties": {
    "brand_id": {
      "title": "Brand Id",
      "type": "string"
    },
    "job_id": {
      "title": "Job Id",
      "type": "string"
    },
    "avatar_id": {
      "title": "Avatar Id",
      "type": "string"
    }
  },
  "required": [
    "brand_id",
    "job_id",
    "avatar_id"
  ],
  "title": "use_avatarArguments",
  "type": "object"
}
```
