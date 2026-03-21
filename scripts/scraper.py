"""
YouTube Channel Scraper - using YouTube Data API v3
Scrapes all videos from a channel sorted by most popular.
Extracts: Title, Tags, Category, Description, Upload Date, Likes, Views, Thumbnail

Setup:
1. Go to https://console.cloud.google.com/
2. Create a project > Enable "YouTube Data API v3"
3. Create an API key (Credentials > Create Credentials > API Key)
4. Paste the key below

Usage:
    python yt_channel_scraper.py
"""

import json
import csv
import sys
import time
from datetime import datetime

# pip install google-api-python-client
from googleapiclient.discovery import build


# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
API_KEY = "AIzaSyA4myj8efrhS-2iCsSYAHjJ8etL4pYl_SE"
CHANNEL_URL = "https://www.youtube.com/@hebbars.kitchen"  # Change this

OUTPUT_FORMAT = "csv"  # "csv" or "json"
OUTPUT_FILE = "videos"  # extension added automatically
MAX_VIDEOS = None  # None = all videos, or set a number like 50
# ──────────────────────────────────────────────


# YouTube video category IDs to human-readable names
CATEGORY_MAP = {
    "1": "Film & Animation", "2": "Autos & Vehicles", "10": "Music",
    "15": "Pets & Animals", "17": "Sports", "18": "Short Movies",
    "19": "Travel & Events", "20": "Gaming", "21": "Videoblogging",
    "22": "People & Blogs", "23": "Comedy", "24": "Entertainment",
    "25": "News & Politics", "26": "Howto & Style", "27": "Education",
    "28": "Science & Technology", "29": "Nonprofits & Activism",
    "30": "Movies", "31": "Anime/Animation", "32": "Action/Adventure",
    "33": "Classics", "34": "Comedy", "35": "Documentary",
    "36": "Drama", "37": "Family", "38": "Foreign",
    "39": "Horror", "40": "Sci-Fi/Fantasy", "41": "Thriller",
    "42": "Shorts", "43": "Shows", "44": "Trailers",
}


def extract_channel_id(youtube, channel_url: str) -> str:
    """Resolve a channel URL to a channel ID."""
    channel_url = channel_url.strip().rstrip("/")

    # Direct channel ID URL
    if "/channel/" in channel_url:
        return channel_url.split("/channel/")[-1].split("/")[0]

    # Handle /@username or /c/name or /user/name
    if "/@" in channel_url:
        handle = channel_url.split("/@")[-1].split("/")[0]
        resp = youtube.search().list(
            part="snippet", q=handle, type="channel", maxResults=1
        ).execute()
    elif "/c/" in channel_url:
        name = channel_url.split("/c/")[-1].split("/")[0]
        resp = youtube.search().list(
            part="snippet", q=name, type="channel", maxResults=1
        ).execute()
    elif "/user/" in channel_url:
        name = channel_url.split("/user/")[-1].split("/")[0]
        resp = youtube.channels().list(
            part="id", forUsername=name
        ).execute()
        if resp.get("items"):
            return resp["items"][0]["id"]
        resp = youtube.search().list(
            part="snippet", q=name, type="channel", maxResults=1
        ).execute()
    else:
        # Try treating the last segment as a handle
        handle = channel_url.split("/")[-1]
        resp = youtube.search().list(
            part="snippet", q=handle, type="channel", maxResults=1
        ).execute()

    if resp.get("items"):
        return resp["items"][0]["snippet"]["channelId"]

    raise ValueError(f"Could not resolve channel ID from: {channel_url}")


def get_uploads_playlist_id(youtube, channel_id: str) -> str:
    """Get the 'uploads' playlist ID for a channel. Costs 1 unit."""
    resp = youtube.channels().list(
        part="contentDetails", id=channel_id
    ).execute()

    if not resp.get("items"):
        raise ValueError(f"Channel not found: {channel_id}")

    return resp["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]


def get_all_video_ids(youtube, playlist_id: str, max_videos=None) -> list:
    """Fetch all video IDs from a playlist. 1 unit per 50 videos."""
    video_ids = []
    next_page = None

    while True:
        resp = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page,
        ).execute()

        for item in resp["items"]:
            video_ids.append(item["contentDetails"]["videoId"])

        if max_videos and len(video_ids) >= max_videos:
            return video_ids[:max_videos]

        next_page = resp.get("nextPageToken")
        if not next_page:
            break

    return video_ids


def get_video_details(youtube, video_ids: list) -> list:
    """Fetch full details for videos in batches of 50. 1 unit per 50 videos."""
    all_videos = []

    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(batch),
        ).execute()

        for item in resp["items"]:
            snippet = item["snippet"]
            stats = item.get("statistics", {})
            category_id = snippet.get("categoryId", "")

            video = {
                "video_id": item["id"],
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "tags": snippet.get("tags", []),
                "category_id": category_id,
                "category": CATEGORY_MAP.get(category_id, f"Unknown ({category_id})"),
                "published_at": snippet.get("publishedAt", ""),
                "thumbnail": snippet.get("thumbnails", {}).get("maxres", {}).get("url")
                    or snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "url": f"https://youtube.com/watch?v={item['id']}",
            }
            all_videos.append(video)

    return all_videos


def save_csv(videos: list, filename: str):
    """Save to CSV."""
    filepath = f"{filename}.csv"
    if not videos:
        print("No videos to save.")
        return

    # Flatten tags list to comma-separated string for CSV
    for v in videos:
        v["tags"] = ", ".join(v["tags"]) if isinstance(v["tags"], list) else v["tags"]

    keys = videos[0].keys()
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(videos)

    print(f"Saved to {filepath}")


def save_json(videos: list, filename: str):
    """Save to JSON."""
    filepath = f"{filename}.json"
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=2, ensure_ascii=False)
    print(f"Saved to {filepath}")


def main():
    if API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: Set your API_KEY in the script first.")
        print("Get one at: https://console.cloud.google.com/")
        sys.exit(1)

    youtube = build("youtube", "v3", developerKey=API_KEY)

    # Step 1: Resolve channel
    print(f"Resolving channel: {CHANNEL_URL}")
    channel_id = extract_channel_id(youtube, CHANNEL_URL)
    print(f"Channel ID: {channel_id}")

    # Step 2: Get uploads playlist
    uploads_id = get_uploads_playlist_id(youtube, channel_id)
    print(f"Uploads playlist: {uploads_id}")

    # Step 3: Get all video IDs
    print("Fetching video IDs...")
    video_ids = get_all_video_ids(youtube, uploads_id, max_videos=MAX_VIDEOS)
    print(f"Found {len(video_ids)} videos")

    # Step 4: Get full details
    print("Fetching video details...")
    videos = get_video_details(youtube, video_ids)

    # Step 5: Sort by views (most popular first)
    videos.sort(key=lambda v: v["views"], reverse=True)

    # Step 6: Save
    if OUTPUT_FORMAT == "csv":
        save_csv(videos, OUTPUT_FILE)
    else:
        save_json(videos, OUTPUT_FILE)

    # Summary
    print(f"\nDone! {len(videos)} videos scraped.")
    if videos:
        print(f"Most popular: {videos[0]['title']} ({videos[0]['views']:,} views)")
        total_views = sum(v["views"] for v in videos)
        print(f"Total views across channel: {total_views:,}")

    # Estimate API units used
    units = 1 + (len(video_ids) // 50 + 1) + (len(video_ids) // 50 + 1)
    print(f"Estimated API units used: ~{units}")


if __name__ == "__main__":
    main()