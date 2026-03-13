# Data QA Checklist — V0 (100 Recipes)

**Purpose:** Validate the 100-recipe V0 subset before app development begins.  
**Run this checklist against `recipes_final.csv` (or the Supabase `recipes` table) before launching.

---

## 1. Completeness

- [ ] All 100 rows have a non-empty `video_id`
- [ ] All 100 rows have a non-empty `recipe_name_english`
- [ ] All 100 rows have a non-empty `thumbnail` URL
- [ ] All 100 rows have a non-empty `url` (YouTube link)
- [ ] All 100 rows have at least one entry in `diet_tags`
- [ ] All 100 rows have at least one entry in `cuisine_tags`
- [ ] All 100 rows have at least one entry in `meal_type`
- [ ] All 100 rows have a non-empty `one_line_hook`
- [ ] All 100 rows have at least one entry in `main_ingredients`

## 2. Diet Tag Accuracy

- [ ] Every recipe tagged `Vegetarian` has NO meat/fish/egg in `ingredients` or `main_ingredients`
- [ ] Every recipe tagged `Vegan` has NO dairy/egg/meat/fish/honey in `ingredients`
- [ ] Every recipe tagged `Non-Veg` contains at least one of: chicken, mutton, lamb, fish, prawn, shrimp, crab, pork in `ingredients`
- [ ] Every recipe tagged `Eggetarian` contains egg in `ingredients` but no meat/fish
- [ ] Eggetarian recipes are also tagged `Non-Veg`
- [ ] No recipe has contradictory tags (e.g., both Vegan and Non-Veg)

## 3. Non-Veg Representation

- [ ] Note the count of Non-Veg recipes in the subset (no minimum required — more recipes will be added later from other sources)
- [ ] Verify Non-Veg tagged recipes actually contain meat/fish/egg in ingredients (accuracy check)

## 4. Cuisine Tag Coverage

- [ ] At least 3 distinct cuisine tags are represented across the 100 recipes
- [ ] No single cuisine tag accounts for more than 70% of recipes (prevents monotony)
- [ ] Cuisine tags use consistent casing and spelling (e.g., "South Indian" not "south indian")

## 5. Link Validity

- [ ] Spot-check 10 random `url` values — YouTube links resolve (HTTP 200)
- [ ] Spot-check 10 random `web_recipe_link` values — links resolve or are empty (not 404)
- [ ] Spot-check 10 random `thumbnail` URLs — images load

## 6. Numeric Sanity

- [ ] `total_time_mins` is between 5 and 600 where present (no 0s, no absurd values)
- [ ] `prep_time_mins` <= `total_time_mins` where both present
- [ ] `servings` is between 1 and 50 where present
- [ ] `ingredient_count` matches the length of `ingredients` JSON array where both present
- [ ] `views` and `likes` are non-negative

## 7. Text Quality

- [ ] `one_line_hook` is 5-15 words (no truncated or overly long hooks)
- [ ] `recipe_name_english` is readable English (no garbled text or raw HTML)
- [ ] `difficulty` is one of: Easy, Medium, Hard (where present)
- [ ] `vibe_tags` entries are human-readable (no encoded values)

## 8. Array / JSON Format

- [ ] `diet_tags`, `cuisine_tags`, `meal_type`, `main_ingredients`, `flavor_profile`, `vibe_tags` are valid arrays (pipe-separated in CSV, `text[]` in Supabase)
- [ ] `ingredients` is valid JSON where present
- [ ] No array field contains empty strings as elements

## 9. Deduplication

- [ ] No duplicate `video_id` values in the 100-recipe subset
- [ ] No near-duplicate `recipe_name_english` values (check for recipes that differ only by whitespace or casing)

---

## Validation Script (Optional)

Run after uploading to Supabase:

```sql
-- Completeness check
SELECT count(*) AS total,
       count(*) FILTER (WHERE recipe_name_english IS NOT NULL) AS has_name,
       count(*) FILTER (WHERE thumbnail IS NOT NULL) AS has_thumb,
       count(*) FILTER (WHERE url IS NOT NULL) AS has_url,
       count(*) FILTER (WHERE one_line_hook IS NOT NULL) AS has_hook,
       count(*) FILTER (WHERE array_length(diet_tags, 1) > 0) AS has_diet,
       count(*) FILTER (WHERE array_length(cuisine_tags, 1) > 0) AS has_cuisine,
       count(*) FILTER (WHERE array_length(main_ingredients, 1) > 0) AS has_main_ing
FROM recipes;

-- Diet tag distribution
SELECT unnest(diet_tags) AS tag, count(*) FROM recipes GROUP BY 1 ORDER BY 2 DESC;

-- Cuisine tag distribution
SELECT unnest(cuisine_tags) AS tag, count(*) FROM recipes GROUP BY 1 ORDER BY 2 DESC;

-- Non-veg count
SELECT count(*) FROM recipes WHERE 'Non-Veg' = ANY(diet_tags);

-- Time sanity
SELECT count(*) FILTER (WHERE total_time_mins <= 0 OR total_time_mins > 600) AS bad_time
FROM recipes WHERE total_time_mins IS NOT NULL;
```

---
*Last updated: 2026-03-11*
