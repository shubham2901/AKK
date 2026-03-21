import requests
from bs4 import BeautifulSoup

url = "https://hebbarskitchen.com/easy-mumbai-style-pav-bhaji-recipe/"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, "html.parser")

# Check for WPRM plugin
wprm = soup.find_all(class_=lambda c: c and "wprm" in c)
print(f"WPRM elements: {len(wprm)}")

# Check for any recipe card plugin
for cls in ["wprm-recipe", "tasty-recipe", "mv-recipe", "recipe-card", "easyrecipe"]:
    found = soup.find(class_=lambda c: c and cls in str(c))
    print(f"{cls}: {'FOUND' if found else 'not found'}")

# Check for time/ingredient patterns in text
text = soup.get_text()
for keyword in ["prep time", "cook time", "total time", "servings", "calories"]:
    idx = text.lower().find(keyword)
    if idx >= 0:
        print(f"'{keyword}' found: ...{text[idx:idx+50]}...")
