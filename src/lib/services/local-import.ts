import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '$lib/supabase/database.types';
import type { LocalStoreData } from '$lib/types';
import { LOCAL_STORAGE_KEY } from '$lib/supabase/constants';

export interface LocalImportCandidate {
  data: LocalStoreData;
  fingerprint: string;
  deckCount: number;
  cardCount: number;
  dismissed: boolean;
}

function isLocalStoreData(value: unknown): value is LocalStoreData {
  if (!value || typeof value !== 'object') return false;
  const decks = (value as { decks?: unknown }).decks;
  if (!Array.isArray(decks)) return false;

  return decks.every((deck) => {
    if (!deck || typeof deck !== 'object') return false;
    const candidate = deck as { name?: unknown; cards?: unknown };
    if (typeof candidate.name !== 'string' || !Array.isArray(candidate.cards)) return false;
    return candidate.cards.every((card) => {
      if (!card || typeof card !== 'object') return false;
      const item = card as { front?: unknown; back?: unknown };
      return typeof item.front === 'string' && typeof item.back === 'string';
    });
  });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function dismissedKey(userId: string, fingerprint: string): string {
  return `mindre-import-dismissed:${userId}:${fingerprint}`;
}

export async function detectLocalImport(userId: string): Promise<LocalImportCandidate | null> {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The local Mindre cache is not valid JSON and could not be imported.');
  }

  if (!isLocalStoreData(parsed) || parsed.decks.length === 0) return null;

  const fingerprint = await sha256(raw);
  return {
    data: parsed,
    fingerprint,
    deckCount: parsed.decks.length,
    cardCount: parsed.decks.reduce((total, deck) => total + deck.cards.length, 0),
    dismissed: localStorage.getItem(dismissedKey(userId, fingerprint)) === '1'
  };
}

export function dismissLocalImport(userId: string, fingerprint: string): void {
  localStorage.setItem(dismissedKey(userId, fingerprint), '1');
}

export async function importLocalData(
  client: SupabaseClient<Database>,
  candidate: LocalImportCandidate
): Promise<{ deckCount: number; cardCount: number; duplicate: boolean }> {
  const { data, error } = await client.rpc('import_local_flashcards', {
    payload: candidate.data as unknown as Json,
    import_fingerprint: candidate.fingerprint
  });

  if (error) throw error;
  const result = data as { deck_count?: number; card_count?: number; duplicate?: boolean } | null;

  localStorage.removeItem(LOCAL_STORAGE_KEY);

  return {
    deckCount: result?.deck_count ?? candidate.deckCount,
    cardCount: result?.card_count ?? candidate.cardCount,
    duplicate: Boolean(result?.duplicate)
  };
}
