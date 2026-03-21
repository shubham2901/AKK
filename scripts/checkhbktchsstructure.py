import requests, json
from bs4 import BeautifulSoup

url = "https://hebbarskitchen.com/easy-mumbai-style-pav-bhaji-recipe/"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, "html.parser")

for script in soup.find_all("script", type="application/ld+json"):
    data = json.loads(script.string)
    print(json.dumps(data, indent=2)[:3000])
