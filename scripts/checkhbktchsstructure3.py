import requests, json
from bs4 import BeautifulSoup

url = "https://hebbarskitchen.com/easy-mumbai-style-pav-bhaji-recipe/"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, "html.parser")

recipe = soup.find(class_="wprm-recipe-container")

# Times
for field in ["prep_time", "cook_time", "total_time"]:
    el = recipe.find(class_=f"wprm-recipe-{field}-container")
    if el:
        minutes = el.find(class_=lambda c: c and "minutes" in str(c))
        print(f"{field}: {el.get_text(strip=True)}")

# Servings
servings = recipe.find(class_="wprm-recipe-servings")
print(f"servings: {servings.get_text(strip=True) if servings else 'N/A'}")

# Course & Cuisine
for field in ["course", "cuisine"]:
    el = recipe.find(class_=f"wprm-recipe-{field}")
    print(f"{field}: {el.get_text(strip=True) if el else 'N/A'}")

# Ingredients
ingredients = recipe.find_all(class_="wprm-recipe-ingredient")
print(f"\ningredients ({len(ingredients)}):")
for ing in ingredients[:8]:
    print(f"  - {ing.get_text(strip=True)}")

# Nutrition
nutrition = recipe.find(class_="wprm-nutrition-label")
if nutrition:
    print(f"\nnutrition: {nutrition.get_text(strip=True)[:200]}")
else:
    # Try individual nutrition fields
    cals = recipe.find(class_=lambda c: c and "calories" in str(c))
    print(f"\ncalories: {cals.get_text(strip=True) if cals else 'N/A'}")
