"""
Recipe Enrichment Script
Takes raw YouTube video CSV from Hebbar's Kitchen (or any recipe channel)
and creates a clean, enriched recipe table using OpenAI API (gpt-4o-mini).

Setup:
    pip install openai

Usage:
    python enrich_recipes.py

Config:
    - Set OPENAI_API_KEY below (or as env var)
    - Set INPUT_CSV to your scraped CSV
    - Set BATCH_SIZE for how many videos to process per run
"""

import csv
import json
import os
import re
import time
import sys

from openai import OpenAI


# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "YOUR_KEY_HERE")
MODEL = "gpt-4o-mini"
INPUT_CSV = "videos.csv"
OUTPUT_CSV = "recipes_enriched.csv"
BATCH_SIZE = 3120        # videos per run (set to 3120 to do all at once)
START_FROM = 0         # skip first N rows (for resuming)
SLEEP_BETWEEN = 0.5    # seconds between API calls
# ──────────────────────────────────────────────


# ──────────────────────────────────────────────
# SCHEMA DEFINITION
# ──────────────────────────────────────────────
SCHEMA = {
    "diet_tags": [
        "Vegetarian", "Vegan", "Jain", "Non-Veg", "Eggetarian",
        "Gluten-Free", "Sugar-Free", "Keto", "High-Protein",
        "Low-Calorie", "Dairy-Free", "Nut-Free",
    ],
    "cuisine": [
        "North Indian", "South Indian", "Andhra", "Bengali", "Gujarati",
        "Hyderabadi", "Kashmiri", "Kerala", "Konkani", "Maharashtrian",
        "Mangalorean", "Punjabi", "Rajasthani", "Tamil", "Udupi",
        "Chettinad", "Indo-Chinese", "Mughlai", "Street Food",
        "Chinese", "Italian", "Mexican", "Continental", "Thai",
        "Middle Eastern", "Japanese", "Korean", "Fusion", "Other",
    ],
    "meal_type": [
        "Breakfast", "Brunch", "Lunch", "Snacks", "Evening Tea",
        "Dinner", "Dessert", "Beverage", "Side Dish", "Condiment", "Appetizer",
    ],
}

OUTPUT_COLUMNS = [
    "video_id",
    "recipe_name_english",
    "recipe_name_hindi",
    "recipe_name_tamil",
    "recipe_name_telugu",
    "recipe_name_marathi",
    "recipe_name_malayalam",
    "alternative_names_english",
    "diet_tags",
    "cuisine",
    "meal_type",
    "youtube_link",
    "web_recipe_link",
    "thumbnail",
    "view_count",
    "like_count",
]
# ──────────────────────────────────────────────


SYSTEM_PROMPT = f"""You are a recipe metadata expert. Given a YouTube recipe video's title, tags, and description, extract structured recipe information.

STRICT RULES:
- recipe_name_english: Clean dish name only. Remove "recipe", "how to make", channel names. e.g. "Pav Bhaji" not "pav bhaji recipe easy mumbai street style"
- recipe_name_hindi/tamil/telugu/marathi/malayalam: Dish name in native script. Use the culturally known name if one exists, otherwise transliterate.
- alternative_names_english: Other English names for this dish. e.g. ["Butter Paneer", "Paneer Makhani"] for Paneer Butter Masala. Empty list if none.
- diet_tags: Pick ALL that apply from ONLY: {json.dumps(SCHEMA['diet_tags'])}
- cuisine: Pick 1-2 from ONLY: {json.dumps(SCHEMA['cuisine'])}
- meal_type: Pick ALL that apply from ONLY: {json.dumps(SCHEMA['meal_type'])}

Respond with valid JSON only."""


def extract_recipe_link(description: str) -> str:
    """Extract the recipe website link from video description."""
    for line in description.split("\n"):
        line_lower = line.strip().lower()
        if "full recipe" in line_lower or "recipe link" in line_lower:
            urls = re.findall(r'https?://[^\s,\'"]+', line, re.IGNORECASE)
            if urls:
                return urls[0]

    # Fallback: find any hebbarskitchen link
    urls = re.findall(r'https?://(?:www\.)?hebbarskitchen\.com/[^\s,\'"]+', description, re.IGNORECASE)
    if urls:
        return urls[0]

    return ""


def build_user_prompt(title: str, tags: str, description: str) -> str:
    """Build the user message for a single video."""
    desc_lines = description.split("\n")
    relevant_desc = "\n".join(
        line for line in desc_lines[:15]
        if not line.strip().startswith("download")
        and "play.google.com" not in line
        and "itunes.apple.com" not in line
        and "Email" not in line
    ).strip()

    return f"""Title: {title}
Tags: {tags[:500]}
Description: {relevant_desc[:500]}"""


def call_openai(client: OpenAI, user_prompt: str) -> dict:
    """Call OpenAI API with JSON mode and parse response."""
    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.3,
        max_tokens=800,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    text = response.choices[0].message.content.strip()
    return json.loads(text)


def process_batch(input_csv: str, output_csv: str, start: int, batch_size: int):
    """Process a batch of videos from the input CSV."""
    client = OpenAI(api_key=OPENAI_API_KEY)

    # Read input
    with open(input_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)

    end = min(start + batch_size, len(all_rows))
    batch = all_rows[start:end]

    print(f"Processing videos {start + 1} to {end} of {len(all_rows)}")

    # Check if output exists (for appending)
    file_exists = os.path.exists(output_csv) and os.path.getsize(output_csv) > 0

    success_count = 0
    error_count = 0

    with open(output_csv, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        if not file_exists:
            writer.writeheader()

        for i, row in enumerate(batch):
            video_num = start + i + 1
            print(f"\n[{video_num}/{len(all_rows)}] {row['title'][:60]}...")

            try:
                # Extract recipe link from description (no LLM needed)
                web_link = extract_recipe_link(row.get("description", ""))

                # Call LLM for enriched fields
                user_prompt = build_user_prompt(
                    row.get("title", ""),
                    row.get("tags", ""),
                    row.get("description", ""),
                )
                enriched = call_openai(client, user_prompt)

                # Build output row
                output_row = {
                    "video_id": row.get("video_id", ""),
                    "recipe_name_english": enriched.get("recipe_name_english", ""),
                    "recipe_name_hindi": enriched.get("recipe_name_hindi", ""),
                    "recipe_name_tamil": enriched.get("recipe_name_tamil", ""),
                    "recipe_name_telugu": enriched.get("recipe_name_telugu", ""),
                    "recipe_name_marathi": enriched.get("recipe_name_marathi", ""),
                    "recipe_name_malayalam": enriched.get("recipe_name_malayalam", ""),
                    "alternative_names_english": " | ".join(enriched.get("alternative_names_english", [])),
                    "diet_tags": " | ".join(enriched.get("diet_tags", [])),
                    "cuisine": " | ".join(enriched.get("cuisine", [])),
                    "meal_type": " | ".join(enriched.get("meal_type", [])),
                    "youtube_link": row.get("url", ""),
                    "web_recipe_link": web_link,
                    "thumbnail": row.get("thumbnail", ""),
                    "view_count": row.get("views", ""),
                    "like_count": row.get("likes", ""),
                }

                writer.writerow(output_row)
                f.flush()
                success_count += 1

                print(f"  -> {enriched.get('recipe_name_english', '?')} | {' | '.join(enriched.get('cuisine', []))}")

            except json.JSONDecodeError as e:
                print(f"  ERROR: Bad JSON - {e}")
                error_count += 1
                continue
            except Exception as e:
                print(f"  ERROR: {e}")
                error_count += 1
                if "rate" in str(e).lower():
                    print("  Waiting 30s for rate limit...")
                    time.sleep(30)
                continue

            if i < len(batch) - 1:
                time.sleep(SLEEP_BETWEEN)

    print(f"\nBatch complete: {success_count} success, {error_count} errors")
    print(f"Output: {output_csv}")
    print(f"To continue, set START_FROM = {end}")


def main():
    if OPENAI_API_KEY == "YOUR_KEY_HERE":
        print("ERROR: Set OPENAI_API_KEY in the script or as env var.")
        print("  export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    if not os.path.exists(INPUT_CSV):
        print(f"ERROR: Input file not found: {INPUT_CSV}")
        sys.exit(1)

    process_batch(INPUT_CSV, OUTPUT_CSV, START_FROM, BATCH_SIZE)

    print(f"\n--- Cost ---")
    print(f"gpt-4o-mini: ~$0.0002/video")
    print(f"3120 videos = ~$0.61 total (fits your $1.44 budget)")


if __name__ == "__main__":
    main()