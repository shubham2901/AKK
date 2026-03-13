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
      recipes: {
        Row: {
          alternative_names_english: string | null
          cook_time_mins: number | null
          course: string | null
          created_at: string | null
          cuisine: string | null
          cuisine_tags: string[] | null
          description: string | null
          diet_tags: string[] | null
          difficulty: string | null
          flavor_profile: string[] | null
          id: string
          ingredient_count: number | null
          ingredients: Json | null
          kid_friendly: boolean | null
          likes: number | null
          main_ingredients: string[] | null
          meal_type: string[] | null
          one_line_hook: string | null
          prep_time_mins: number | null
          published_at: string | null
          recipe_name_english: string | null
          recipe_name_hindi: string | null
          recipe_name_malayalam: string | null
          recipe_name_marathi: string | null
          recipe_name_tamil: string | null
          recipe_name_telugu: string | null
          servings: number | null
          thumbnail: string | null
          title: string | null
          total_time_mins: number | null
          url: string | null
          vibe_tags: string[] | null
          video_id: string
          views: number | null
          web_recipe_link: string | null
        }
        Insert: {
          alternative_names_english?: string | null
          cook_time_mins?: number | null
          course?: string | null
          created_at?: string | null
          cuisine?: string | null
          cuisine_tags?: string[] | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          flavor_profile?: string[] | null
          id?: string
          ingredient_count?: number | null
          ingredients?: Json | null
          kid_friendly?: boolean | null
          likes?: number | null
          main_ingredients?: string[] | null
          meal_type?: string[] | null
          one_line_hook?: string | null
          prep_time_mins?: number | null
          published_at?: string | null
          recipe_name_english?: string | null
          recipe_name_hindi?: string | null
          recipe_name_malayalam?: string | null
          recipe_name_marathi?: string | null
          recipe_name_tamil?: string | null
          recipe_name_telugu?: string | null
          servings?: number | null
          thumbnail?: string | null
          title?: string | null
          total_time_mins?: number | null
          url?: string | null
          vibe_tags?: string[] | null
          video_id: string
          views?: number | null
          web_recipe_link?: string | null
        }
        Update: {
          alternative_names_english?: string | null
          cook_time_mins?: number | null
          course?: string | null
          created_at?: string | null
          cuisine?: string | null
          cuisine_tags?: string[] | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          flavor_profile?: string[] | null
          id?: string
          ingredient_count?: number | null
          ingredients?: Json | null
          kid_friendly?: boolean | null
          likes?: number | null
          main_ingredients?: string[] | null
          meal_type?: string[] | null
          one_line_hook?: string | null
          prep_time_mins?: number | null
          published_at?: string | null
          recipe_name_english?: string | null
          recipe_name_hindi?: string | null
          recipe_name_malayalam?: string | null
          recipe_name_marathi?: string | null
          recipe_name_tamil?: string | null
          recipe_name_telugu?: string | null
          servings?: number | null
          thumbnail?: string | null
          title?: string | null
          total_time_mins?: number | null
          url?: string | null
          vibe_tags?: string[] | null
          video_id?: string
          views?: number | null
          web_recipe_link?: string | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          recipe_id: string | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          recipe_id?: string | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          recipe_id?: string | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_recipe_id_fkey"
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
export type UserSession = Tables<'user_sessions'>
export type UserInteraction = Tables<'user_interactions'>

export type DietPreference = 'Vegetarian' | 'Non-Veg' | 'Vegan'

export interface Preferences {
  diet: DietPreference | null
  blocklist: string[]
  onboardingComplete: boolean
}

export interface Session {
  cuisines: string[]
  ingredientFilter: string | null
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
