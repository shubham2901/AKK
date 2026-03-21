"""
Dedup recipes by name & merge pass1 + pass2 into a single file.

Steps:
  1. Load recipes_enriched_clean.csv, drop empty recipe names
  2. Group by recipe_name_english (case-insensitive), keep highest-view row
  3. Collect ALL video_ids per recipe (for v3 multi-video support)
  4. Assign unique recipe_id (RCP_0001 .. RCP_NNNN)
  5. Load recipes_enriched_pass2.csv, join by video_id of kept row
  6. Write merged output to recipes_merged.csv

Usage:
    python3 scripts/dedup_merge.py
"""

import csv
import os
import sys

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
PASS1_CSV = os.path.join(BASE_DIR, "recipes_enriched_clean.csv")
PASS2_CSV = os.path.join(BASE_DIR, "recipes_enriched_pass2.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "recipes_merged.csv")

PASS2_FIELDS = [
    "main_ingredients",
    "one_line_hook",
    "flavor_profile",
    "vibe_tags",
    "kid_friendly",
    "difficulty",
    "diet_tags_updated",
]

OUTPUT_COLUMNS = [
    "recipe_id",
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
    "main_ingredients",
    "one_line_hook",
    "flavor_profile",
    "vibe_tags",
    "kid_friendly",
    "difficulty",
    "diet_tags_updated",
    "primary_video_id",
    "all_video_ids",
    "youtube_link",
    "web_recipe_link",
    "thumbnail",
    "view_count",
    "like_count",
]


def safe_int(val: str) -> int:
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


def main():
    with open(PASS1_CSV, "r", encoding="utf-8") as f:
        pass1_rows = list(csv.DictReader(f))
    print(f"Pass 1 loaded: {len(pass1_rows)} rows")

    with open(PASS2_CSV, "r", encoding="utf-8") as f:
        pass2_rows = list(csv.DictReader(f))
    pass2_by_vid = {row["video_id"]: row for row in pass2_rows}
    print(f"Pass 2 loaded: {len(pass2_rows)} rows ({len(pass2_by_vid)} unique)")

    groups: dict[str, list[dict]] = {}
    dropped_empty = 0
    for row in pass1_rows:
        name = row["recipe_name_english"].strip()
        if not name:
            dropped_empty += 1
            continue
        key = name.lower()
        groups.setdefault(key, []).append(row)

    print(f"Dropped {dropped_empty} rows with empty recipe names")
    print(f"Unique recipes: {len(groups)}")

    deduped = []
    for key, rows in groups.items():
        rows.sort(key=lambda r: safe_int(r.get("view_count", "0")), reverse=True)
        best = rows[0]
        all_vids = [r["video_id"] for r in rows]
        deduped.append((best, all_vids))

    deduped.sort(key=lambda x: safe_int(x[0].get("view_count", "0")), reverse=True)

    merged_count = 0
    missing_pass2 = 0

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()

        for i, (row, all_vids) in enumerate(deduped, 1):
            recipe_id = f"RCP_{i:04d}"
            vid = row["video_id"]

            p2 = pass2_by_vid.get(vid, {})
            if not p2:
                for alt_vid in all_vids:
                    p2 = pass2_by_vid.get(alt_vid, {})
                    if p2:
                        break
            if p2:
                merged_count += 1
            else:
                missing_pass2 += 1

            out = {
                "recipe_id": recipe_id,
                "recipe_name_english": row.get("recipe_name_english", ""),
                "recipe_name_hindi": row.get("recipe_name_hindi", ""),
                "recipe_name_tamil": row.get("recipe_name_tamil", ""),
                "recipe_name_telugu": row.get("recipe_name_telugu", ""),
                "recipe_name_marathi": row.get("recipe_name_marathi", ""),
                "recipe_name_malayalam": row.get("recipe_name_malayalam", ""),
                "alternative_names_english": row.get("alternative_names_english", ""),
                "diet_tags": row.get("diet_tags", ""),
                "cuisine": row.get("cuisine", ""),
                "meal_type": row.get("meal_type", ""),
                "main_ingredients": p2.get("main_ingredients", ""),
                "one_line_hook": p2.get("one_line_hook", ""),
                "flavor_profile": p2.get("flavor_profile", ""),
                "vibe_tags": p2.get("vibe_tags", ""),
                "kid_friendly": p2.get("kid_friendly", ""),
                "difficulty": p2.get("difficulty", ""),
                "diet_tags_updated": p2.get("diet_tags_updated", ""),
                "primary_video_id": vid,
                "all_video_ids": " | ".join(all_vids),
                "youtube_link": row.get("youtube_link", ""),
                "web_recipe_link": row.get("web_recipe_link", ""),
                "thumbnail": row.get("thumbnail", ""),
                "view_count": row.get("view_count", ""),
                "like_count": row.get("like_count", ""),
            }
            writer.writerow(out)

    print(f"\nOutput: {OUTPUT_CSV}")
    print(f"Total recipes: {len(deduped)}")
    print(f"Pass2 matched: {merged_count}")
    print(f"Pass2 missing: {missing_pass2}")
    print(f"Sorted by view count (highest first)")


if __name__ == "__main__":
    main()
