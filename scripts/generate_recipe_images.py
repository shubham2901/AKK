"""
Recipe Image Generator v1
=========================
1. Reads recipes from Excel
2. Uses Gemini 2.5 Flash to generate a detailed food photography prompt per recipe
3. Sends prompt to Nano Banana 2 (free tier) or Imagen 4 (paid) to generate image
4. Saves images locally as {recipe_id}.png
5. Resumes from where it left off — existing images are skipped

Usage:
  export GEMINI_API_KEY="your-key"
  python generate_recipe_images.py                    # default: first 50, nano banana 2
  python generate_recipe_images.py --limit 50         # first 50 recipes
  python generate_recipe_images.py --limit 0          # all recipes
  python generate_recipe_images.py --model imagen4    # use imagen 4 (paid, $0.03/img)
  python generate_recipe_images.py --start-from 100   # start from recipe index 100

Requirements:
  pip install pandas openpyxl requests google-genai Pillow
"""

import pandas as pd
import requests
import json
import time
import os
import sys
import argparse
import base64
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIG
# ============================================================
INPUT_FILE = "recipes_v4_llm_cleaned.xlsx"  # change to your cleaned file
IMAGE_DIR = "./recipe_images"
PROMPT_CACHE_FILE = "prompt_cache.json"
FAILED_LOG = "failed_images.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Models
PROMPT_MODEL = "gemini-2.5-flash"  # for generating image prompts (cheap)
NANO_BANANA_MODEL = "gemini-3.1-flash-image-preview"  # free tier image gen
IMAGEN4_MODEL = "imagen-4.0-generate-001"  # paid image gen

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Rate limiting
PROMPT_DELAY = 1.0       # seconds between prompt generation calls
IMAGE_DELAY_NANO = 3.0   # seconds between nano banana calls (free tier is strict)
IMAGE_DELAY_IMAGEN = 1.5 # seconds between imagen 4 calls
RETRY_LIMIT = 3
RETRY_DELAY = 10

# Image settings
IMAGE_WIDTH = 832
IMAGE_HEIGHT = 1248  # 2:3 portrait

# ============================================================
# STYLE ANCHOR — appended to every prompt
# ============================================================
STYLE_ANCHOR = """warm natural single light source from left side, dark walnut wood \
surface, muted earthy tones not oversaturated, no HDR, portrait 2:3, \
realistic not styled, no symmetrical arrangements, no perfect circles \
or geometric garnishing, no steam, no floating elements, lighting is \
natural and slightly imperfect not studio-perfect, no text, no watermark"""

# ============================================================
# PROMPT GENERATION SYSTEM PROMPT
# ============================================================
PROMPT_GEN_SYSTEM = """You are an expert Indian food photographer writing prompts for AI image generation.

Given a recipe name, its type, and cuisine, write a SINGLE detailed image generation prompt.

ABSOLUTE RULES — follow every one:
1. Start with "realistic Indian food photography, [DISH NAME],"
2. Include an HONEST description of what the dish actually looks like when served at home
3. Specify the correct vessel:
   - Curries/dals → dark ceramic bowl or copper karahi
   - Rice dishes → dark ceramic plate or copper handi
   - Breads (roti/naan/paratha) → directly on dark walnut surface or in a cane basket
   - Dosa/idli/uttapam → round steel plate with small katori for chutney/sambar
   - Snacks/chaat → steel plate or newspaper-lined basket if street food
   - Desserts/mithai → small dark ceramic plate or brass katori
   - Beverages → glass tumbler or copper glass, NOT a bowl
   - Soups → dark ceramic soup bowl
   - Accompaniments (chutney/raita) → small dark ceramic katori
   - Salads → dark ceramic plate
4. NEVER use white plates. NEVER use western plating.
5. Always: dark walnut wood surface, 45-degree angle, subject centered at 65% of frame
6. Always: shallow depth of field, background naturally blurred
7. Garnish ONLY if natural to the dish — must be resting on surface, never floating
8. No steam, no splashes, no drips, no floating elements, no geometric arrangements
9. Realistic home-serving portion, not tiny aesthetic portion
10. End with the style anchor (I will append it — do NOT include it yourself)

REFERENCE PROMPTS — match this style, detail level, and structure exactly:

Example 1 (Curry in bowl):
realistic Indian food photography, Palak Paneer, spinach gravy with paneer cubes served in a dark ceramic bowl, dark walnut wood surface, 45-degree slightly elevated angle, subject centered and occupying 65% of portrait frame, shallow depth of field with background naturally blurred, warm natural single light source from the left side, no flash, no studio white light, uneven natural surface texture not glossy or magazine-perfect, realistic portion size like an actual home serving, no western plating or tweezered garnish, small coriander sprig resting naturally on surface only, no floating elements, no steam, no geometric butter cuts, no splashes or drips, dark ceramic vessel appropriate to Indian cooking, no white plates, muted warm earthy color tones not oversaturated, no HDR, same dark walnut surface throughout, no text, no watermark, no branding on props, portrait 2:3 aspect ratio, looks like real home-cooked food not Michelin Star plating

Example 2 (South Indian on steel plate):
realistic Indian food photography, Masala Dosa, naturally folded golden-brown crepe on a round steel plate with small katori of sambar and coconut chutney beside it, dark walnut wood surface, 45-degree slightly elevated angle, subject centered and occupying 65% of portrait frame, shallow depth of field with background naturally blurred, warm natural single light source from the left, uneven natural browning on dosa surface not uniformly perfect, realistic portion like a restaurant serving, no western plating, no floating ingredients, no steam effects, no overly symmetrical arrangement, steel plate appropriate to South Indian serving style, muted warm earthy tones not oversaturated, no HDR, dark walnut surface, no text, no watermark, portrait 2:3, looks like real food not styled food magazine shot

Example 3 (Dal in copper):
realistic Indian food photography, Dal Makhani, dark creamy lentil curry in a copper karahi with natural surface texture, dark walnut wood surface, 45-degree slightly elevated angle, subject centered occupying 65% of portrait frame, shallow depth of field with background naturally blurred, warm natural single light source from the left side, thin natural cream swirl resting on surface not geometric or symmetrical, realistic portion size, no western plating or tweezered garnish, no floating elements, no steam, no perfect glossy surface, copper karahi appropriate to North Indian cooking, muted warm earthy tones not oversaturated, no HDR, dark walnut surface, no text, no watermark, portrait 2:3, looks like real dal not a food commercial

YOUR OUTPUT must follow the same structure: dish description → vessel → surface → angle → framing → depth of field → lighting → texture notes → portion → negatives → vessel appropriateness → color tones → format.

OUTPUT: Return ONLY the prompt text. No quotes, no markdown, no explanation. Just the prompt."""


# ============================================================
# HELPERS
# ============================================================
def ensure_dirs():
    Path(IMAGE_DIR).mkdir(exist_ok=True)


def image_exists(recipe_id):
    return Path(f"{IMAGE_DIR}/{recipe_id}.png").exists()


def load_json(path):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}


def save_json(data, path):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ============================================================
# STEP 1: Generate image prompt via Gemini 2.5 Flash
# ============================================================
def generate_image_prompt(recipe_name, recipe_type, cuisine, prompt_cache):
    """Generate a detailed food photography prompt using Gemini."""
    cache_key = str(recipe_name).strip()
    if cache_key in prompt_cache:
        return prompt_cache[cache_key]

    url = f"{GEMINI_BASE_URL}/{PROMPT_MODEL}:generateContent?key={GEMINI_API_KEY}"

    user_msg = (
        f"Recipe: {recipe_name}\n"
        f"Type: {recipe_type}\n"
        f"Cuisine: {cuisine}\n\n"
        f"Write the image generation prompt."
    )

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": PROMPT_GEN_SYSTEM + "\n\n" + user_msg}]}
        ],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
    }

    for attempt in range(RETRY_LIMIT):
        try:
            resp = requests.post(url, json=payload, timeout=30)
            if resp.status_code == 429:
                print(f"      Prompt gen rate limited. Waiting {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                continue
            if resp.status_code != 200:
                print(f"      Prompt gen error {resp.status_code}: {resp.text[:150]}")
                time.sleep(RETRY_DELAY)
                continue

            data = resp.json()
            prompt_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Strip markdown if present
            prompt_text = prompt_text.strip("`").strip()
            if prompt_text.startswith("```"):
                prompt_text = prompt_text.split("\n", 1)[1]
            if prompt_text.endswith("```"):
                prompt_text = prompt_text.rsplit("```", 1)[0].strip()

            # Append style anchor
            full_prompt = f"{prompt_text}, {STYLE_ANCHOR}, looks like real home-cooked food not a food commercial"

            prompt_cache[cache_key] = full_prompt
            return full_prompt

        except Exception as e:
            print(f"      Prompt gen exception (attempt {attempt+1}): {e}")
            time.sleep(RETRY_DELAY)

    return None


# ============================================================
# STEP 2a: Generate image via Nano Banana 2 (free tier)
# ============================================================
def generate_image_nano_banana(prompt, output_path):
    """Generate image using Gemini native image gen (Nano Banana 2)."""
    url = f"{GEMINI_BASE_URL}/{NANO_BANANA_MODEL}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
            "temperature": 0.5,
        },
    }

    for attempt in range(RETRY_LIMIT):
        try:
            resp = requests.post(url, json=payload, timeout=120)

            if resp.status_code == 429:
                wait = RETRY_DELAY * (attempt + 2)
                print(f"      Rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                print(f"      Nano Banana error {resp.status_code}: {resp.text[:200]}")
                time.sleep(RETRY_DELAY)
                continue

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                print(f"      No candidates returned")
                time.sleep(RETRY_DELAY)
                continue

            # Extract image from response parts
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    img_data = part["inlineData"]["data"]
                    img_bytes = base64.b64decode(img_data)
                    with open(output_path, "wb") as f:
                        f.write(img_bytes)
                    return True

            print(f"      No image in response parts")
            time.sleep(RETRY_DELAY)

        except Exception as e:
            print(f"      Nano Banana exception (attempt {attempt+1}): {e}")
            time.sleep(RETRY_DELAY)

    return False


# ============================================================
# STEP 2b: Generate image via Imagen 4 (paid)
# ============================================================
def generate_image_imagen4(prompt, output_path):
    """Generate image using Imagen 4 API."""
    url = f"{GEMINI_BASE_URL}/{IMAGEN4_MODEL}:predict?key={GEMINI_API_KEY}"

    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "2:3",
            "outputOptions": {"mimeType": "image/png"},
        },
    }

    for attempt in range(RETRY_LIMIT):
        try:
            resp = requests.post(url, json=payload, timeout=120)

            if resp.status_code == 429:
                wait = RETRY_DELAY * (attempt + 2)
                print(f"      Rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                print(f"      Imagen 4 error {resp.status_code}: {resp.text[:200]}")
                # Try alternate endpoint format
                if attempt == 0:
                    return generate_image_imagen4_alt(prompt, output_path)
                time.sleep(RETRY_DELAY)
                continue

            data = resp.json()
            predictions = data.get("predictions", [])
            if predictions:
                img_b64 = predictions[0].get("bytesBase64Encoded", "")
                if img_b64:
                    img_bytes = base64.b64decode(img_b64)
                    with open(output_path, "wb") as f:
                        f.write(img_bytes)
                    return True

            print(f"      No image in Imagen 4 response")
            time.sleep(RETRY_DELAY)

        except Exception as e:
            print(f"      Imagen 4 exception (attempt {attempt+1}): {e}")
            time.sleep(RETRY_DELAY)

    return False


def generate_image_imagen4_alt(prompt, output_path):
    """Alternate Imagen 4 endpoint using generateImages format."""
    url = f"{GEMINI_BASE_URL}/{IMAGEN4_MODEL}:generateImages?key={GEMINI_API_KEY}"

    payload = {
        "prompt": prompt,
        "config": {
            "numberOfImages": 1,
            "aspectRatio": "2:3",
            "outputMimeType": "image/png",
        },
    }

    for attempt in range(RETRY_LIMIT):
        try:
            resp = requests.post(url, json=payload, timeout=120)
            if resp.status_code != 200:
                print(f"      Imagen 4 alt error {resp.status_code}: {resp.text[:200]}")
                time.sleep(RETRY_DELAY)
                continue

            data = resp.json()
            images = data.get("generatedImages", data.get("images", []))
            if images:
                img_data = images[0].get("image", {})
                img_b64 = img_data.get("imageBytes", img_data.get("bytesBase64Encoded", ""))
                if img_b64:
                    img_bytes = base64.b64decode(img_b64)
                    with open(output_path, "wb") as f:
                        f.write(img_bytes)
                    return True

            print(f"      No image in alt response")
            time.sleep(RETRY_DELAY)

        except Exception as e:
            print(f"      Imagen 4 alt exception (attempt {attempt+1}): {e}")
            time.sleep(RETRY_DELAY)

    return False


# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(description="Generate recipe images")
    parser.add_argument("--limit", type=int, default=50, help="Number of recipes to process (0 = all)")
    parser.add_argument("--model", choices=["nano", "imagen4"], default="nano", help="Image gen model")
    parser.add_argument("--start-from", type=int, default=0, help="Start from this row index")
    parser.add_argument("--retry-failed", action="store_true", help="Only retry previously failed recipes")
    args = parser.parse_args()

    if not GEMINI_API_KEY:
        print("ERROR: Set GEMINI_API_KEY environment variable")
        sys.exit(1)

    ensure_dirs()

    # Load recipes
    df = pd.read_excel(INPUT_FILE, sheet_name="recipes")
    print(f"Loaded {len(df)} recipes")

    # Load caches
    prompt_cache = load_json(PROMPT_CACHE_FILE)
    failed_log = load_json(FAILED_LOG)

    # Determine which recipes to process
    if args.retry_failed:
        indices = [int(k) for k in failed_log.keys()]
        print(f"Retrying {len(indices)} previously failed recipes")
    else:
        indices = list(range(args.start_from, len(df)))
        if args.limit > 0:
            indices = indices[:args.limit]

    # Stats
    generated = 0
    skipped = 0
    failed = 0
    start_time = datetime.now()

    image_delay = IMAGE_DELAY_IMAGEN if args.model == "imagen4" else IMAGE_DELAY_NANO

    print(f"Model: {'Imagen 4 (paid)' if args.model == 'imagen4' else 'Nano Banana 2 (free)'}")
    print(f"Processing {len(indices)} recipes")
    print(f"Images will be saved to {IMAGE_DIR}/")
    print("-" * 60)

    for count, idx in enumerate(indices, 1):
        row = df.iloc[idx]
        recipe_id = row["recipe_id"]
        name = row["recipe_name_english"]
        recipe_type = row.get("recipe_type", "Main Course")
        cuisine = row.get("cuisine", "Pan-Indian")
        output_path = f"{IMAGE_DIR}/{recipe_id}.png"

        # Skip if image already exists
        if os.path.exists(output_path):
            skipped += 1
            continue

        print(f"[{count}/{len(indices)}] #{recipe_id} {name}")

        # Step 1: Generate prompt
        prompt = generate_image_prompt(name, recipe_type, cuisine, prompt_cache)
        if not prompt:
            print(f"  FAILED to generate prompt — skipping")
            failed_log[str(idx)] = {"recipe_id": recipe_id, "name": name, "error": "prompt_gen_failed"}
            failed += 1
            continue

        # Save prompt cache after each generation
        save_json(prompt_cache, PROMPT_CACHE_FILE)

        print(f"  Prompt: {prompt[:100]}...")
        time.sleep(PROMPT_DELAY)

        # Step 2: Generate image
        if args.model == "imagen4":
            success = generate_image_imagen4(prompt, output_path)
        else:
            success = generate_image_nano_banana(prompt, output_path)

        if success:
            size_kb = os.path.getsize(output_path) / 1024
            print(f"  ✓ Saved ({size_kb:.0f} KB)")
            generated += 1
            # Remove from failed log if it was there
            if str(idx) in failed_log:
                del failed_log[str(idx)]
        else:
            print(f"  ✗ FAILED")
            failed_log[str(idx)] = {"recipe_id": recipe_id, "name": name, "error": "image_gen_failed"}
            failed += 1

        # Save failed log after each attempt
        save_json(failed_log, FAILED_LOG)

        # Rate limit
        time.sleep(image_delay)

    # Summary
    elapsed = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Generated: {generated}")
    print(f"Skipped (already existed): {skipped}")
    print(f"Failed: {failed}")
    print(f"Time: {elapsed/60:.1f} minutes")
    if generated > 0:
        print(f"Avg time per image: {elapsed/generated:.1f}s")
    if failed > 0:
        print(f"\nFailed recipes saved to {FAILED_LOG}")
        print(f"Run with --retry-failed to retry them")
    print(f"Prompt cache saved to {PROMPT_CACHE_FILE} ({len(prompt_cache)} prompts)")


if __name__ == "__main__":
    main()
