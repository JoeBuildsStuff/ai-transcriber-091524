export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_articles: {
        Row: {
          content: string
          generated_at: string | null
          id: number
          rss_feed_id: number
          title: string
        }
        Insert: {
          content: string
          generated_at?: string | null
          id?: number
          rss_feed_id: number
          title: string
        }
        Update: {
          content?: string
          generated_at?: string | null
          id?: number
          rss_feed_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_articles_rss_feed_id_fkey"
            columns: ["rss_feed_id"]
            isOneToOne: false
            referencedRelation: "article_view"
            referencedColumns: ["rss_feed_id"]
          },
          {
            foreignKeyName: "ai_articles_rss_feed_id_fkey"
            columns: ["rss_feed_id"]
            isOneToOne: false
            referencedRelation: "rss_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_feed: {
        Row: {
          categories: Json | null
          content: string | null
          content_snippet: string | null
          created_at: string | null
          guid: string
          id: number
          img_url: string | null
          iso_date: string | null
          link: string
          pub_date: string | null
          should_draft_article: boolean | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          categories?: Json | null
          content?: string | null
          content_snippet?: string | null
          created_at?: string | null
          guid: string
          id?: number
          img_url?: string | null
          iso_date?: string | null
          link: string
          pub_date?: string | null
          should_draft_article?: boolean | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          categories?: Json | null
          content?: string | null
          content_snippet?: string | null
          created_at?: string | null
          guid?: string
          id?: number
          img_url?: string | null
          iso_date?: string | null
          link?: string
          pub_date?: string | null
          should_draft_article?: boolean | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      article_view: {
        Row: {
          ai_article_id: number | null
          ai_content: string | null
          ai_title: string | null
          categories: Json | null
          content_snippet: string | null
          generated_at: string | null
          guid: string | null
          iso_date: string | null
          original_content: string | null
          original_link: string | null
          original_title: string | null
          pub_date: string | null
          rss_feed_id: number | null
        }
        Relationships: []
      }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
