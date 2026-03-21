"""
Bulk web scraper for Hebbar's Kitchen recipe pages.
Extracts WPRM (WordPress Recipe Maker) structured data:
prep_time, cook_time, total_time, servings, course, cuisine, ingredients.

Features:
- Resume support: skips already-scraped video_ids
- Retry with exponential backoff
- Failed URLs logged to scrape_failures.json
- Progress logging every 100 recipes

Usage:
    python scripts/web_scraper.py [--sleep 0.3] [--limit 50]
"""

import argparse
import csv
import json
import os
import re
import time

import requests
from bs4 import BeautifulSoup

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
INPUT_CSV = os.path.join(BASE_DIR, "recipes_enriched_clean.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "recipes_web_scraped.csv")
FAILURES_FILE = os.path.join(BASE_DIR, "scrape_failures.json")

OUTPUT_COLUMNS = [
    "video_id",
    "prep_time_mins",
    "cook_time_mins",
    "total_time_mins",
    "servings",
    "course",
    "cuisine_raw",
    "ingredients",
    "ingredient_count",
]

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
MAX_RETRIES = 3
TIMEOUT = 10


def parse_minutes(text: str) -> int | None:
    """Extract integer minutes from WPRM time text like '10minutes' or '1hour30minutes'."""
    if not text:
        return None
    text = text.lower().strip()
    total = 0
    hours = re.findall(r"(\d+)\s*hour", text)
    mins = re.findall(r"(\d+)\s*minute", text)
    if hours:
        total += int(hours[0]) * 60
    if mins:
        total += int(mins[0])
    if total == 0:
        digits = re.findall(r"\d+", text)
        if digits:
            total = int(digits[0])
    return total if total > 0 else None


def scrape_recipe(url: str) -> dict:
    """Scrape a single recipe page. Returns dict with extracted fields."""
    result = {col: None for col in OUTPUT_COLUMNS if col != "video_id"}

    resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    recipe = soup.find(class_="wprm-recipe-container")

    if not recipe:
        return result

    for field, key in [
        ("prep_time", "prep_time_mins"),
        ("cook_time", "cook_time_mins"),
        ("total_time", "total_time_mins"),
    ]:
        el = recipe.find(
            class_=lambda c: c and f"wprm-recipe-{field}" in str(c)
            and "container" not in str(c)
            and "label" not in str(c)
            and "unit" not in str(c)
        )
        if el:
            result[key] = parse_minutes(el.get_text(strip=True))

    servings_el = recipe.find(class_="wprm-recipe-servings")
    if servings_el:
        digits = re.findall(r"\d+", servings_el.get_text(strip=True))
        if digits:
            result["servings"] = int(digits[0])

    course_el = recipe.find(class_="wprm-recipe-course")
    if course_el:
        result["course"] = course_el.get_text(strip=True)

    cuisine_el = recipe.find(class_="wprm-recipe-cuisine")
    if cuisine_el:
        result["cuisine_raw"] = cuisine_el.get_text(strip=True)

    ingredient_els = recipe.find_all(class_="wprm-recipe-ingredient")
    if ingredient_els:
        ingredients = [el.get_text(strip=True) for el in ingredient_els]
        # Clean up the checkbox character
        ingredients = [i.lstrip("▢").strip() for i in ingredients]
        result["ingredients"] = json.dumps(ingredients, ensure_ascii=False)
        result["ingredient_count"] = len(ingredients)

    return result


def load_already_scraped() -> set:
    """Load video_ids already in output CSV."""
    if not os.path.exists(OUTPUT_CSV):
        return set()
    with open(OUTPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["video_id"] for row in reader}


def scrape_with_retry(url: str) -> dict | None:
    """Scrape with exponential backoff retry."""
    for attempt in range(MAX_RETRIES):
        try:
            return scrape_recipe(url)
        except requests.exceptions.RequestException as e:
            wait = 2 ** attempt
            if attempt < MAX_RETRIES - 1:
                print(f"    Retry {attempt + 1}/{MAX_RETRIES} in {wait}s: {e}")
                time.sleep(wait)
            else:
                raise


def main():
    parser = argparse.ArgumentParser(description="Bulk scrape Hebbar's Kitchen recipes")
    parser.add_argument("--sleep", type=float, default=0.3, help="Sleep between requests")
    parser.add_argument("--limit", type=int, default=None, help="Max recipes to scrape")
    args = parser.parse_args()

    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)

    already_done = load_already_scraped()
    print(f"Total recipes: {len(all_rows)}")
    print(f"Already scraped: {len(already_done)}")

    to_scrape = [r for r in all_rows if r["video_id"] not in already_done]
    if args.limit:
        to_scrape = to_scrape[: args.limit]

    print(f"To scrape this run: {len(to_scrape)}")

    file_exists = os.path.exists(OUTPUT_CSV) and os.path.getsize(OUTPUT_CSV) > 0

    failures = []
    success = 0
    skipped = 0

    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        if not file_exists:
            writer.writeheader()

        for i, row in enumerate(to_scrape):
            vid = row["video_id"]
            url = row.get("web_recipe_link", "").strip()

            if not url:
                skipped += 1
                writer.writerow({"video_id": vid})
                f.flush()
                if (i + 1) % 100 == 0:
                    print(f"[{i + 1}/{len(to_scrape)}] Progress: {success} ok, {len(failures)} fail, {skipped} skip")
                continue

            try:
                data = scrape_with_retry(url)
                data["video_id"] = vid
                writer.writerow(data)
                f.flush()
                success += 1

                if (i + 1) % 100 == 0:
                    print(f"[{i + 1}/{len(to_scrape)}] Progress: {success} ok, {len(failures)} fail, {skipped} skip")

            except Exception as e:
                print(f"  FAILED {vid} ({url}): {e}")
                failures.append({"video_id": vid, "url": url, "error": str(e)})
                writer.writerow({"video_id": vid})
                f.flush()

            if i < len(to_scrape) - 1:
                time.sleep(args.sleep)

    if failures:
        with open(FAILURES_FILE, "w", encoding="utf-8") as f:
            json.dump(failures, f, indent=2)
        print(f"\nFailures logged to {FAILURES_FILE}")

    print(f"\nDone: {success} scraped, {len(failures)} failed, {skipped} skipped (no URL)")
    print(f"Output: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
