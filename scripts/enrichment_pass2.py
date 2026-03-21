"""
LLM Enrichment Pass 2 for KKB recipe dataset.
Uses OpenAI gpt-4o-mini to extract:
  - main_ingredients (top 1-3)
  - one_line_hook
  - flavor_profile
  - vibe_tags
  - kid_friendly
  - difficulty
  - diet re-tagging (Eggetarian / Non-Veg based on ingredients)

Requires: OPENAI_API_KEY env var
Input: recipes_enriched_clean.csv + recipes_web_scraped.csv
Output: recipes_enriched_pass2.csv

Usage:
    python scripts/enrichment_pass2.py [--batch-size 3120] [--start-from 0] [--dry-run]
"""

import argparse
import csv
import json
import os
import sys
import time

from openai import OpenAI

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
ENRICHED_CSV = os.path.join(BASE_DIR, "recipes_enriched_clean.csv")
SCRAPED_CSV = os.path.join(BASE_DIR, "recipes_web_scraped.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "recipes_enriched_pass2.csv")
FAILURES_FILE = os.path.join(BASE_DIR, "enrichment_p2_failures.json")

MODEL = "gpt-4o-mini"
SLEEP_BETWEEN = 0.5

OUTPUT_COLUMNS = [
    "video_id",
    "main_ingredients",
    "one_line_hook",
    "flavor_profile",
    "vibe_tags",
    "kid_friendly",
    "difficulty",
    "diet_tags_updated",
]

VALID_FLAVORS = ["Spicy", "Mild", "Sweet", "Tangy", "Savory", "Rich", "Light", "Bitter", "Umami"]
VALID_VIBES = [
    "Quick Weeknight", "Comfort Food", "Impressive", "Healthy",
    "Indulgent", "Festival", "Party", "Kids",
]

SYSTEM_PROMPT = f"""You are a recipe analysis expert for Indian cooking. Given recipe data, extract structured metadata.

RULES:
- main_ingredients: The 1-3 PRIMARY ingredients that define this dish (not spices/oil/water). E.g. for Paneer Butter Masala: ["Paneer", "Tomato", "Cream"]. For Masala Dosa: ["Rice Batter", "Potato"]. Use simple English names.
- one_line_hook: A compelling 6-10 word description that makes someone want to cook this. Focus on taste/texture/speed. E.g. "Crispy outside, soft inside, ready in 20 min" or "Rich, creamy gravy that melts in your mouth". Do NOT start with "A" or "An".
- flavor_profile: Pick 1-3 from ONLY: {json.dumps(VALID_FLAVORS)}
- vibe_tags: Pick 1-3 from ONLY: {json.dumps(VALID_VIBES)}
- kid_friendly: true if mild flavors, familiar textures, no strong spice. false otherwise.
- difficulty: "Easy" (under 30 min, <10 ingredients, simple technique), "Medium" (30-60 min or 10-20 ingredients), "Hard" (60+ min or 20+ ingredients or complex technique like tempering/layering)
- diet_retag: Look at the ingredients list carefully. If ANY ingredient is chicken/mutton/lamb/goat/fish/prawn/shrimp/crab/pork/beef/meat, add "Non-Veg". If egg is an ingredient (not "eggless"), add BOTH "Eggetarian" and "Non-Veg". Return the FULL updated diet_tags list.

Respond with valid JSON only. Keys: main_ingredients (array), one_line_hook (string), flavor_profile (array), vibe_tags (array), kid_friendly (boolean), difficulty (string), diet_tags_updated (array)."""


def load_scraped_data() -> dict:
    """Load web-scraped data keyed by video_id."""
    if not os.path.exists(SCRAPED_CSV):
        print(f"Warning: {SCRAPED_CSV} not found. Proceeding without scraped data.")
        return {}
    with open(SCRAPED_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["video_id"]: row for row in reader}


def load_already_done() -> set:
    """Load video_ids already processed in output CSV."""
    if not os.path.exists(OUTPUT_CSV) or os.path.getsize(OUTPUT_CSV) == 0:
        return set()
    with open(OUTPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["video_id"] for row in reader}


def build_user_prompt(enriched_row: dict, scraped_row: dict | None) -> str:
    """Build the prompt for a single recipe."""
    parts = [f"Recipe name: {enriched_row.get('recipe_name_english', '')}"]

    cuisine = enriched_row.get("cuisine", "")
    if cuisine:
        parts.append(f"Cuisine: {cuisine}")

    diet = enriched_row.get("diet_tags", "")
    if diet:
        parts.append(f"Current diet tags: {diet}")

    meal = enriched_row.get("meal_type", "")
    if meal:
        parts.append(f"Meal type: {meal}")

    if scraped_row:
        ingredients = scraped_row.get("ingredients", "")
        if ingredients:
            parts.append(f"Ingredients: {ingredients}")

        course = scraped_row.get("course", "")
        if course:
            parts.append(f"Course: {course}")

        total_time = scraped_row.get("total_time_mins", "")
        if total_time:
            parts.append(f"Total time: {total_time} minutes")

        count = scraped_row.get("ingredient_count", "")
        if count:
            parts.append(f"Ingredient count: {count}")

    return "\n".join(parts)


def call_openai(client: OpenAI, user_prompt: str) -> dict:
    """Call OpenAI and parse JSON response."""
    response = client.chat.completions.create(
        model=MODEL,
        temperature=0.3,
        max_tokens=500,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return json.loads(response.choices[0].message.content.strip())


def format_output_row(video_id: str, result: dict) -> dict:
    """Format LLM result into CSV row."""
    return {
        "video_id": video_id,
        "main_ingredients": " | ".join(result.get("main_ingredients", [])),
        "one_line_hook": result.get("one_line_hook", ""),
        "flavor_profile": " | ".join(result.get("flavor_profile", [])),
        "vibe_tags": " | ".join(result.get("vibe_tags", [])),
        "kid_friendly": str(result.get("kid_friendly", False)).lower(),
        "difficulty": result.get("difficulty", ""),
        "diet_tags_updated": " | ".join(result.get("diet_tags_updated", [])),
    }


def main():
    parser = argparse.ArgumentParser(description="LLM Enrichment Pass 2")
    parser.add_argument("--batch-size", type=int, default=3120)
    parser.add_argument("--start-from", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true", help="Process 5 rows, print, don't write")
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: Set OPENAI_API_KEY environment variable.")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    with open(ENRICHED_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)

    scraped_data = load_scraped_data()
    already_done = load_already_done()

    print(f"Total recipes: {len(all_rows)}")
    print(f"Scraped data available: {len(scraped_data)}")
    print(f"Already enriched (pass 2): {len(already_done)}")

    to_process = [r for r in all_rows if r["video_id"] not in already_done]
    to_process = to_process[args.start_from : args.start_from + args.batch_size]

    if args.dry_run:
        to_process = to_process[:5]

    print(f"To process this run: {len(to_process)}")

    failures = []
    success = 0

    file_exists = os.path.exists(OUTPUT_CSV) and os.path.getsize(OUTPUT_CSV) > 0

    output_file = None if args.dry_run else open(OUTPUT_CSV, "a", newline="", encoding="utf-8")
    writer = None

    if output_file:
        writer = csv.DictWriter(output_file, fieldnames=OUTPUT_COLUMNS)
        if not file_exists:
            writer.writeheader()

    try:
        for i, row in enumerate(to_process):
            vid = row["video_id"]
            name = row.get("recipe_name_english", "?")
            print(f"\n[{i + 1}/{len(to_process)}] {name}")

            scraped_row = scraped_data.get(vid)
            user_prompt = build_user_prompt(row, scraped_row)

            try:
                result = call_openai(client, user_prompt)
                output_row = format_output_row(vid, result)

                if args.dry_run:
                    print(f"  main_ingredients: {output_row['main_ingredients']}")
                    print(f"  one_line_hook: {output_row['one_line_hook']}")
                    print(f"  flavor_profile: {output_row['flavor_profile']}")
                    print(f"  vibe_tags: {output_row['vibe_tags']}")
                    print(f"  kid_friendly: {output_row['kid_friendly']}")
                    print(f"  difficulty: {output_row['difficulty']}")
                    print(f"  diet_tags_updated: {output_row['diet_tags_updated']}")
                else:
                    writer.writerow(output_row)
                    output_file.flush()

                success += 1

            except json.JSONDecodeError as e:
                print(f"  ERROR: Bad JSON - {e}")
                failures.append({"video_id": vid, "error": f"JSON: {e}"})
            except Exception as e:
                print(f"  ERROR: {e}")
                failures.append({"video_id": vid, "error": str(e)})
                if "rate" in str(e).lower():
                    print("  Waiting 30s for rate limit...")
                    time.sleep(30)

            if i < len(to_process) - 1:
                time.sleep(SLEEP_BETWEEN)

            if (i + 1) % 100 == 0:
                print(f"\n--- Progress: {success} ok, {len(failures)} fail ---")

    finally:
        if output_file:
            output_file.close()

    if failures:
        with open(FAILURES_FILE, "w", encoding="utf-8") as f:
            json.dump(failures, f, indent=2)
        print(f"\nFailures logged to {FAILURES_FILE}")

    print(f"\nDone: {success} enriched, {len(failures)} failed")
    if not args.dry_run:
        print(f"Output: {OUTPUT_CSV}")

    cost = success * 0.0003
    print(f"Estimated cost: ~${cost:.2f}")


if __name__ == "__main__":
    main()
