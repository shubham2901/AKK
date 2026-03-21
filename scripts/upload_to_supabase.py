"""
Upload recipes_final.csv to Supabase.
Converts pipe-separated strings to arrays, JSON strings to dicts.
Upserts on video_id in batches.

Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY

Usage:
    python scripts/upload_to_supabase.py --file recipes_final.csv [--dry-run] [--batch-size 100]
"""

import argparse
import csv
import json
import os
import sys

from supabase import create_client

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")

ARRAY_COLUMNS = [
    "diet_tags",
    "cuisine_tags",
    "meal_type",
    "main_ingredients",
    "flavor_profile",
    "vibe_tags",
]

INT_COLUMNS = [
    "views",
    "likes",
    "prep_time_mins",
    "cook_time_mins",
    "total_time_mins",
    "servings",
    "ingredient_count",
]

BOOL_COLUMNS = ["kid_friendly"]
JSONB_COLUMNS = ["ingredients"]

SKIP_COLUMNS = ["cuisine_raw"]


def parse_row(row: dict) -> dict:
    """Convert a CSV row into a Supabase-ready dict."""
    parsed = {}

    for key, value in row.items():
        if key in SKIP_COLUMNS:
            continue

        value = value.strip() if value else ""

        if key == "cuisine_raw":
            parsed["cuisine"] = value if value else None
            continue

        if not value:
            parsed[key] = None
            continue

        if key in ARRAY_COLUMNS:
            parsed[key] = [v.strip() for v in value.split("|") if v.strip()]
        elif key in INT_COLUMNS:
            try:
                parsed[key] = int(value)
            except ValueError:
                parsed[key] = None
        elif key in BOOL_COLUMNS:
            parsed[key] = value.lower() in ("true", "1", "yes")
        elif key in JSONB_COLUMNS:
            try:
                parsed[key] = json.loads(value)
            except (json.JSONDecodeError, TypeError):
                parsed[key] = None
        else:
            parsed[key] = value

    # Map cuisine_raw -> cuisine (the raw website cuisine)
    if "cuisine_raw" in row:
        val = row["cuisine_raw"].strip()
        parsed["cuisine"] = val if val else None

    return parsed


def main():
    parser = argparse.ArgumentParser(description="Upload recipes to Supabase")
    parser.add_argument("--file", default=os.path.join(BASE_DIR, "recipes_final.csv"))
    parser.add_argument("--dry-run", action="store_true", help="Print first 5 rows, don't insert")
    parser.add_argument("--batch-size", type=int, default=100)
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not args.dry_run and (not supabase_url or not supabase_key):
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        print("  export SUPABASE_URL=https://xxx.supabase.co")
        print("  export SUPABASE_SERVICE_KEY=eyJ...")
        sys.exit(1)

    if not os.path.exists(args.file):
        print(f"ERROR: File not found: {args.file}")
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)

    print(f"Loaded {len(all_rows)} recipes from {args.file}")

    parsed_rows = [parse_row(r) for r in all_rows]

    if args.dry_run:
        print("\n--- Dry run: first 5 rows ---")
        for i, row in enumerate(parsed_rows[:5]):
            print(f"\nRow {i + 1}:")
            for k, v in row.items():
                display = str(v)
                if len(display) > 100:
                    display = display[:100] + "..."
                print(f"  {k}: {display} ({type(v).__name__})")
        print(f"\nDry run complete. {len(parsed_rows)} rows would be upserted.")
        return

    client = create_client(supabase_url, supabase_key)
    success = 0
    errors = 0

    for i in range(0, len(parsed_rows), args.batch_size):
        batch = parsed_rows[i : i + args.batch_size]
        batch_num = i // args.batch_size + 1
        total_batches = (len(parsed_rows) + args.batch_size - 1) // args.batch_size

        try:
            result = (
                client.table("recipes")
                .upsert(batch, on_conflict="video_id")
                .execute()
            )
            success += len(batch)
            print(f"Batch {batch_num}/{total_batches}: {len(batch)} rows upserted ({success} total)")
        except Exception as e:
            errors += len(batch)
            print(f"Batch {batch_num}/{total_batches}: ERROR - {e}")

            for row in batch:
                try:
                    client.table("recipes").upsert(
                        row, on_conflict="video_id"
                    ).execute()
                    success += 1
                    errors -= 1
                except Exception as e2:
                    print(f"  FAILED {row.get('video_id', '?')}: {e2}")

    print(f"\nDone: {success} upserted, {errors} failed")


if __name__ == "__main__":
    main()
