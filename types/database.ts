export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          age: number | null;
          location: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          age?: number | null;
          location?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          age?: number | null;
          location?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_fields: {
        Row: {
          id: string;
          user_id: string;
          field_id: string | null;
          field_name: string | null;
          year: string | null;
          country_code: string | null;
          geometry: Json | null;
          properties: Json | null;
          center_lat: number | null;
          center_lng: number | null;
          area_m2: number | null;
          confidence: number | null;
          season: string | null;
          crop_stage: string | null;
          crops: string[] | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id?: string | null;
          field_name?: string | null;
          year?: string | null;
          country_code?: string | null;
          geometry?: Json | null;
          properties?: Json | null;
          center_lat?: number | null;
          center_lng?: number | null;
          area_m2?: number | null;
          confidence?: number | null;
          season?: string | null;
          crop_stage?: string | null;
          crops?: string[] | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string | null;
          field_name?: string | null;
          year?: string | null;
          country_code?: string | null;
          geometry?: Json | null;
          properties?: Json | null;
          center_lat?: number | null;
          center_lng?: number | null;
          area_m2?: number | null;
          confidence?: number | null;
          season?: string | null;
          crop_stage?: string | null;
          crops?: string[] | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_fields_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      update_user_phone: {
        Args: {
          new_phone: string;
        };
        Returns: void;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];
