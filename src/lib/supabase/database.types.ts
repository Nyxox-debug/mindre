export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          front_type: 'text' | 'code';
          back_type: 'text' | 'code';
          language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          front_type: 'text' | 'code';
          back_type: 'text' | 'code';
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          front?: string;
          back?: string;
          front_type?: 'text' | 'code';
          back_type?: 'text' | 'code';
          language?: string | null;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'cards_deck_id_fkey';
          columns: ['deck_id'];
          isOneToOne: false;
          referencedRelation: 'decks';
          referencedColumns: ['id'];
        }];
      };
      card_progress: {
        Row: {
          user_id: string;
          card_id: string;
          repetitions: number;
          interval_days: number;
          ease_factor: number;
          due_at: string;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          card_id: string;
          repetitions?: number;
          interval_days?: number;
          ease_factor?: number;
          due_at?: string;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          repetitions?: number;
          interval_days?: number;
          ease_factor?: number;
          due_at?: string;
          last_reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'card_progress_card_id_fkey';
          columns: ['card_id'];
          isOneToOne: false;
          referencedRelation: 'cards';
          referencedColumns: ['id'];
        }];
      };
      card_attachments: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          original_filename?: string;
          mime_type?: string;
          size_bytes?: number;
        };
        Relationships: [{
          foreignKeyName: 'card_attachments_card_id_fkey';
          columns: ['card_id'];
          isOneToOne: true;
          referencedRelation: 'cards';
          referencedColumns: ['id'];
        }];
      };
      local_imports: {
        Row: {
          id: string;
          user_id: string;
          source_key: string;
          fingerprint: string;
          deck_count: number;
          card_count: number;
          imported_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_key?: string;
          fingerprint: string;
          deck_count?: number;
          card_count?: number;
          imported_at?: string;
        };
        Update: {
          source_key?: string;
          fingerprint?: string;
          deck_count?: number;
          card_count?: number;
          imported_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      import_local_flashcards: {
        Args: { payload: Json; import_fingerprint: string };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
