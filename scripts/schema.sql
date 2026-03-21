-- KKB Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables and indexes.

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        text UNIQUE NOT NULL,
    title           text,
    description     text,
    published_at    timestamptz,
    thumbnail       text,
    views           bigint,
    likes           bigint,
    url             text,
    web_recipe_link text,

    recipe_name_english     text,
    recipe_name_hindi       text,
    recipe_name_tamil       text,
    recipe_name_telugu      text,
    recipe_name_marathi     text,
    recipe_name_malayalam   text,
    alternative_names_english text,

    diet_tags           text[],
    cuisine_tags        text[],
    meal_type           text[],

    prep_time_mins      int,
    cook_time_mins      int,
    total_time_mins     int,
    servings            int,
    course              text,
    cuisine             text,       -- raw cuisine from website
    ingredients         jsonb,
    ingredient_count    int,
    difficulty          text,

    main_ingredients    text[],
    one_line_hook       text,
    flavor_profile      text[],
    vibe_tags           text[],
    kid_friendly        boolean,

    created_at          timestamptz DEFAULT now()
);

-- GIN indexes for array column filtering
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_tags ON recipes USING GIN (cuisine_tags);
CREATE INDEX IF NOT EXISTS idx_recipes_diet_tags ON recipes USING GIN (diet_tags);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes USING GIN (meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_main_ingredients ON recipes USING GIN (main_ingredients);

-- B-tree index for time-based sorting/filtering
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes (total_time_mins);


-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          text NOT NULL,
    created_at          timestamptz DEFAULT now(),
    cuisine_filter      text[],
    meal_type_filter    text,
    ingredient_filter   text,
    diet_preference     text,
    cuisine_blocklist   text[]
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions (session_id);


-- ============================================
-- USER INTERACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_interactions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      text NOT NULL,
    recipe_id       uuid REFERENCES recipes(id),
    action          text NOT NULL,
    timestamp       timestamptz DEFAULT now(),
    metadata        jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_interactions_session ON user_interactions (session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_recipe ON user_interactions (recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions (action);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Recipes: public read, no public write
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_public_read" ON recipes
    FOR SELECT USING (true);

-- User sessions: public insert, no read
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_public_insert" ON user_sessions
    FOR INSERT WITH CHECK (true);

-- User interactions: public insert with validation, no read
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactions_public_insert" ON user_interactions
    FOR INSERT WITH CHECK (
        session_id IS NOT NULL
        AND length(session_id) >= 8
        AND action IN (
            'swipe_next', 'swipe_prev', 'tap', 'youtube_open', 'web_open',
            'found_my_pick', 'back_no_action', 'shuffle',
            'session_success_inferred', 'filter_change'
        )
    );

-- ============================================
-- ABUSE PROTECTION
-- ============================================

-- Prevent excessively large metadata payloads (max 4KB)
ALTER TABLE user_interactions ADD CONSTRAINT chk_metadata_size
    CHECK (metadata IS NULL OR length(metadata::text) <= 4096);

-- Prevent future-dated timestamps
ALTER TABLE user_interactions ADD CONSTRAINT chk_timestamp_sane
    CHECK (timestamp <= now() + interval '1 minute');
