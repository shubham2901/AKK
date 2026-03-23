#!/bin/bash
# Upload recipe images to Supabase Storage bucket
# Uses the Supabase Storage REST API with anon key

SUPABASE_URL="https://hrmhnovohubkfyxipjog.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybWhub3ZvaHVia2Z5eGlwam9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzExNTUsImV4cCI6MjA4ODM0NzE1NX0.VqmlspXh0l-gJPQL8VYOalT43ahm4oSd78vrc2wb_SE"
BUCKET="recipe-images"
IMAGE_DIR="$(dirname "$0")/../data/recipe_images"

SUCCESS=0
FAIL=0
TOTAL=$(ls "$IMAGE_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')

echo "Uploading $TOTAL images to Supabase Storage..."

for img in "$IMAGE_DIR"/*.png; do
  filename=$(basename "$img")
  
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: image/png" \
    -H "x-upsert: true" \
    --data-binary "@${img}")
  
  if [ "$response" = "200" ]; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $filename (HTTP $response)"
  fi
  
  if [ $((SUCCESS % 50)) -eq 0 ] && [ $SUCCESS -gt 0 ]; then
    echo "  Progress: $SUCCESS/$TOTAL uploaded..."
  fi
done

echo ""
echo "Done! Success: $SUCCESS, Failed: $FAIL, Total: $TOTAL"
