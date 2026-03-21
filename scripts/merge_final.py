"""
Merge all data sources into a single recipes_final.csv matching the PRD schema.

Sources (all joined on video_id):
  1. videos.csv            — title, description, published_at
  2. recipes_enriched_clean.csv — recipe names, diet_tags, cuisine→cuisine_tags, meal_type, links, thumbnail, views, likes
  3. recipes_web_scraped.csv   — prep/cook/total time, servings, course, cuisine_raw, ingredients, ingredient_count
  4. recipes_enriched_pass2.csv — main_ingredients, one_line_hook, flavor_profile, vibe_tags, kid_friendly, difficulty, diet_tags_updated

Output: recipes_final.csv

Usage:
    python scripts/merge_final.py [--validate]
"""

import argparse
import csv
import os

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")

VIDEOS_CSV = os.path.join(BASE_DIR, "videos.csv")
ENRICHED_CSV = os.path.join(BASE_DIR, "recipes_enriched_clean.csv")
SCRAPED_CSV = os.path.join(BASE_DIR, "recipes_web_scraped.csv")
PASS2_CSV = os.path.join(BASE_DIR, "recipes_enriched_pass2.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "recipes_final.csv")

FINAL_COLUMNS = [
    "video_id",
    "title",
    "description",
    "published_at",
    "thumbnail",
    "views",
    "likes",
    "url",
    "web_recipe_link",
    "recipe_name_english",
    "recipe_name_hindi",
    "recipe_name_tamil",
    "recipe_name_telugu",
    "recipe_name_marathi",
    "recipe_name_malayalam",
    "alternative_names_english",
    "diet_tags",
    "cuisine_tags",
    "meal_type",
    "prep_time_mins",
    "cook_time_mins",
    "total_time_mins",
    "servings",
    "course",
    "cuisine_raw",
    "ingredients",
    "ingredient_count",
    "difficulty",
    "main_ingredients",
    "one_line_hook",
    "flavor_profile",
    "vibe_tags",
    "kid_friendly",
]


def load_csv_as_dict(path: str) -> dict:
    """Load CSV into dict keyed by video_id."""
    if not os.path.exists(path):
        print(f"Warning: {path} not found, skipping.")
        return {}
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        result = {}
        for row in reader:
            vid = row.get("video_id", "")
            if vid:
                result[vid] = row
        return result


def main():
    parser = argparse.ArgumentParser(description="Merge all recipe data sources")
    parser.add_argument("--validate", action="store_true", help="Print validation stats")
    args = parser.parse_args()

    videos = load_csv_as_dict(VIDEOS_CSV)
    enriched = load_csv_as_dict(ENRICHED_CSV)
    scraped = load_csv_as_dict(SCRAPED_CSV)
    pass2 = load_csv_as_dict(PASS2_CSV)

    print(f"videos.csv: {len(videos)} rows")
    print(f"recipes_enriched_clean.csv: {len(enriched)} rows")
    print(f"recipes_web_scraped.csv: {len(scraped)} rows")
    print(f"recipes_enriched_pass2.csv: {len(pass2)} rows")

    all_video_ids = sorted(enriched.keys())
    print(f"\nMerging {len(all_video_ids)} recipes...")

    merged_rows = []
    for vid in all_video_ids:
        v = videos.get(vid, {})
        e = enriched.get(vid, {})
        s = scraped.get(vid, {})
        p = pass2.get(vid, {})

        diet_tags = p.get("diet_tags_updated", "") or e.get("diet_tags", "")

        row = {
            "video_id": vid,
            "title": v.get("title", ""),
            "description": v.get("description", ""),
            "published_at": v.get("published_at", ""),
            "thumbnail": e.get("thumbnail", "") or v.get("thumbnail", ""),
            "views": e.get("view_count", "") or v.get("views", ""),
            "likes": e.get("like_count", "") or v.get("likes", ""),
            "url": e.get("youtube_link", "") or v.get("url", ""),
            "web_recipe_link": e.get("web_recipe_link", ""),
            "recipe_name_english": e.get("recipe_name_english", ""),
            "recipe_name_hindi": e.get("recipe_name_hindi", ""),
            "recipe_name_tamil": e.get("recipe_name_tamil", ""),
            "recipe_name_telugu": e.get("recipe_name_telugu", ""),
            "recipe_name_marathi": e.get("recipe_name_marathi", ""),
            "recipe_name_malayalam": e.get("recipe_name_malayalam", ""),
            "alternative_names_english": e.get("alternative_names_english", ""),
            "diet_tags": diet_tags,
            "cuisine_tags": e.get("cuisine", ""),
            "meal_type": e.get("meal_type", ""),
            "prep_time_mins": s.get("prep_time_mins", ""),
            "cook_time_mins": s.get("cook_time_mins", ""),
            "total_time_mins": s.get("total_time_mins", ""),
            "servings": s.get("servings", ""),
            "course": s.get("course", ""),
            "cuisine_raw": s.get("cuisine_raw", ""),
            "ingredients": s.get("ingredients", ""),
            "ingredient_count": s.get("ingredient_count", ""),
            "difficulty": p.get("difficulty", ""),
            "main_ingredients": p.get("main_ingredients", ""),
            "one_line_hook": p.get("one_line_hook", ""),
            "flavor_profile": p.get("flavor_profile", ""),
            "vibe_tags": p.get("vibe_tags", ""),
            "kid_friendly": p.get("kid_friendly", ""),
        }
        merged_rows.append(row)

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FINAL_COLUMNS)
        writer.writeheader()
        writer.writerows(merged_rows)

    print(f"Output: {OUTPUT_CSV} ({len(merged_rows)} rows)")

    if args.validate:
        print("\n--- Validation ---")
        for col in FINAL_COLUMNS:
            filled = sum(1 for r in merged_rows if r.get(col, "").strip())
            pct = (filled / len(merged_rows)) * 100 if merged_rows else 0
            print(f"  {col}: {filled}/{len(merged_rows)} ({pct:.0f}%)")

        print("\n--- Sample row ---")
        if merged_rows:
            sample = merged_rows[0]
            for k, v in sample.items():
                val = str(v)[:80]
                print(f"  {k}: {val}")


if __name__ == "__main__":
    main()
