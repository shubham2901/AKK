"""
Deduplicate recipes_enriched.csv on video_id.
Keeps first occurrence, logs removed duplicates.

Usage:
    python scripts/dedup.py
"""

import csv
import os

INPUT_CSV = os.path.join(os.path.dirname(__file__), "..", "recipes_enriched.csv")
OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "..", "recipes_enriched_clean.csv")


def main():
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        all_rows = list(reader)

    print(f"Input rows: {len(all_rows)}")

    seen = set()
    unique_rows = []
    duplicates = []

    for row in all_rows:
        vid = row["video_id"]
        if vid in seen:
            duplicates.append(row)
        else:
            seen.add(vid)
            unique_rows.append(row)

    print(f"Unique rows: {len(unique_rows)}")
    print(f"Duplicates removed: {len(duplicates)}")

    if duplicates:
        print("\nRemoved duplicates:")
        for d in duplicates:
            print(f"  {d['video_id']} | {d.get('recipe_name_english', '?')}")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unique_rows)

    print(f"\nOutput: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
