import { writable } from "svelte/store";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "$lib/supabase/database.types";
import type { Profile } from "$lib/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

let client: SupabaseClient<Database> | null = null;

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  return {
    subscribe,
    resolve(
      supabase: SupabaseClient<Database>,
      user: User | null,
      profile: Profile | null,
    ) {
      client = supabase;
      set({ user, profile, loading: false, error: null });
    },
    setError(message: string | null) {
      update((state) => ({ ...state, error: message }));
    },
    async signInWithGoogle(next = "/") {
      if (!client) throw new Error("Authentication is still loading.");
      update((state) => ({ ...state, loading: true, error: null }));

      const callback = new URL("/auth/callback", window.location.origin);

      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
        },
      });

      if (error) {
        update((state) => ({ ...state, loading: false, error: error.message }));
        throw error;
      }
    },
    async signOut() {
      if (!client) return;
      update((state) => ({ ...state, loading: true, error: null }));
      const { error } = await client.auth.signOut();
      if (error) {
        update((state) => ({ ...state, loading: false, error: error.message }));
        throw error;
      }
      set({ user: null, profile: null, loading: false, error: null });
      window.location.assign("/login");
    },
    reset() {
      client = null;
      set({ user: null, profile: null, loading: true, error: null });
    },
  };
}

export const authStore = createAuthStore();
