export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      recipe_videos: {
        Row: {
          channel_name: string | null
          created_at: string | null
          id: string
          likes: number | null
          published_at: string | null
          recipe_id: number
          thumbnail: string | null
          title: string | null
          url: string | null
          video_id: string
          views: number | null
          web_recipe_link: string | null
        }
        Insert: {
          channel_name?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          published_at?: string | null
          recipe_id: number
          thumbnail?: string | null
          title?: string | null
          url?: string | null
          video_id: string
          views?: number | null
          web_recipe_link?: string | null
        }
        Update: {
          channel_name?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          published_at?: string | null
          recipe_id?: number
          thumbnail?: string | null
          title?: string | null
          url?: string | null
          video_id?: string
          views?: number | null
          web_recipe_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_videos_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          alternative_names_english: string | null
          cook_time_minutes: number | null
          created_at: string | null
          cuisine: string[] | null
          description: string | null
          diet_tags: string[] | null
          difficulty: string | null
          hero_image: string | null
          id: number
          image_path: string | null
          is_verified: boolean | null
          meal_time: string[] | null
          one_line_hook: string | null
          popularity_score: number | null
          prep_time_minutes: number | null
          recipe_name_english: string
          recipe_name_hindi: string | null
          recipe_name_malayalam: string | null
          recipe_name_marathi: string | null
          recipe_name_tamil: string | null
          recipe_name_telugu: string | null
          recipe_type: string | null
          seasonal_tags: string[] | null
          serving_size: number | null
          spice_level: string | null
          updated_at: string | null
        }
        Insert: {
          alternative_names_english?: string | null
          cook_time_minutes?: number | null
          created_at?: string | null
          cuisine?: string[] | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          hero_image?: string | null
          id: number
          image_path?: string | null
          is_verified?: boolean | null
          meal_time?: string[] | null
          one_line_hook?: string | null
          popularity_score?: number | null
          prep_time_minutes?: number | null
          recipe_name_english: string
          recipe_name_hindi?: string | null
          recipe_name_malayalam?: string | null
          recipe_name_marathi?: string | null
          recipe_name_tamil?: string | null
          recipe_name_telugu?: string | null
          recipe_type?: string | null
          seasonal_tags?: string[] | null
          serving_size?: number | null
          spice_level?: string | null
          updated_at?: string | null
        }
        Update: {
          alternative_names_english?: string | null
          cook_time_minutes?: number | null
          created_at?: string | null
          cuisine?: string[] | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          hero_image?: string | null
          id?: number
          image_path?: string | null
          is_verified?: boolean | null
          meal_time?: string[] | null
          one_line_hook?: string | null
          popularity_score?: number | null
          prep_time_minutes?: number | null
          recipe_name_english?: string
          recipe_name_hindi?: string | null
          recipe_name_malayalam?: string | null
          recipe_name_marathi?: string | null
          recipe_name_tamil?: string | null
          recipe_name_telugu?: string | null
          recipe_type?: string | null
          seasonal_tags?: string[] | null
          serving_size?: number | null
          spice_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          recipe_id: number | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          recipe_id?: number | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          recipe_id?: number | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_recipe_id_fkey1"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          cuisine_blocklist: string[] | null
          cuisine_filter: string[] | null
          diet_preference: string | null
          id: string
          ingredient_filter: string | null
          meal_type_filter: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          cuisine_blocklist?: string[] | null
          cuisine_filter?: string[] | null
          diet_preference?: string | null
          id?: string
          ingredient_filter?: string | null
          meal_type_filter?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          cuisine_blocklist?: string[] | null
          cuisine_filter?: string[] | null
          diet_preference?: string | null
          id?: string
          ingredient_filter?: string | null
          meal_type_filter?: string | null
          session_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// ─── App Type Aliases ───────────────────────────────────────────────

export type Recipe = Tables<'recipes'>
export type RecipeVideo = Tables<'recipe_videos'>
export type UserSession = Tables<'user_sessions'>
export type UserInteraction = Tables<'user_interactions'>

export type DietPreference = 'Vegetarian' | 'Non-Veg' | 'Eggetarian'

export interface Preferences {
  diet: DietPreference | null
  blocklist: string[]
  onboardingComplete: boolean
}

export interface Session {
  cuisines: string[]
  ingredientFilter: string | null
  cuisineFilter: string[]
  mealTypeFilter: string[]
  recipeTypeFilter: string[]
  pool: Recipe[]
  currentIndex: number
  lastActiveAt: number
  setupComplete: boolean
}

export interface SessionState {
  sessionId: string
  preferences: Preferences
  session: Session
}
