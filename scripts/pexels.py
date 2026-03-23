import requests
import json
import time

PEXELS_API_KEY = "XGs64KLmaQH5qQ3oECZHL1X7P3LTmUKQIBmLpIrKPUZotjOU1ujqkJTB"

# Paste any 10 recipe names from your dataset to test
TEST_RECIPES = [
    "Instant Idli",
    "Palak Paneer",
    "Masala Dosa",
    "Dal Makhani",
    "Chole Bhature",
    "Paneer Butter Masala",
    "Aloo Paratha",
    "Rajma Chawal",
    "Idli Sambar",
    "Rava Upma"
]

def search_pexels(recipe_name, api_key):
    headers = {"Authorization": api_key}
    params = {
        "query": f"{recipe_name} food",
        "per_page": 3,
        "orientation": "portrait",
        "size": "large"
    }
    resp = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params)
    
    if resp.status_code != 200:
        return None, f"Error {resp.status_code}"
    
    data = resp.json()
    if not data.get("photos"):
        return None, "No results"
    
    # Best photo = first result, portrait, largest size
    photo = data["photos"][0]
    return {
        "url": photo["src"]["large2x"],  # ~1200px wide
        "photographer": photo["photographer"],
        "pexels_url": photo["url"]
    }, None

def main():
    if PEXELS_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: Add your Pexels API key at the top of the script")
        print("Get one free at: https://www.pexels.com/api/")
        return

    results = []
    print(f"Testing {len(TEST_RECIPES)} recipes...\n")
    
    for recipe in TEST_RECIPES:
        photo, error = search_pexels(recipe, PEXELS_API_KEY)
        
        if error:
            print(f"MISS  {recipe:<35} → {error}")
            results.append({"recipe": recipe, "status": "miss", "url": None})
        else:
            print(f"HIT   {recipe:<35} → {photo['url'][:60]}...")
            results.append({"recipe": recipe, "status": "hit", **photo})
        
        time.sleep(0.3)  # stay within rate limits

    # Summary
    hits = sum(1 for r in results if r["status"] == "hit")
    print(f"\n--- Results: {hits}/{len(TEST_RECIPES)} matched ---")
    
    # Save to JSON so you can ins the image URLs in browser
    with open("pexels_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Full results saved to pexels_test_results.json")
    print("\nOpen the URLs in your browser to check image quality.")

if __name__ == "__main__":
    main()
