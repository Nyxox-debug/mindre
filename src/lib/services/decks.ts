import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';
import type { Deck } from '$lib/types';
import { MINDRE_BUCKET } from '$lib/supabase/constants';
import { mapDeck } from './mappers';

const DECK_SELECT = `
  id,
  name,
  created_at,
  updated_at,
  cards (
    id,
    deck_id,
    front,
    back,
    front_type,
    back_type,
    language,
    created_at,
    updated_at,
    card_progress (*),
    card_attachments (*)
  )
`;

export async function fetchDecks(client: SupabaseClient<Database>): Promise<Deck[]> {
  const { data, error } = await client
    .from('decks')
    .select(DECK_SELECT)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapDeck);
}

export async function fetchDeck(
  client: SupabaseClient<Database>,
  deckId: string
): Promise<Deck | null> {
  const { data, error } = await client
    .from('decks')
    .select(DECK_SELECT)
    .eq('id', deckId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDeck(data) : null;
}

export async function createDeck(
  client: SupabaseClient<Database>,
  userId: string,
  name: string
): Promise<Deck> {
  const { data, error } = await client
    .from('decks')
    .insert({ user_id: userId, name })
    .select('id, name, created_at, updated_at')
    .single();

  if (error) throw error;
  return mapDeck({ ...data, cards: [] });
}

export async function renameDeck(
  client: SupabaseClient<Database>,
  deckId: string,
  name: string
): Promise<void> {
  const { error } = await client.from('decks').update({ name }).eq('id', deckId);
  if (error) throw error;
}

export async function deleteDeck(
  client: SupabaseClient<Database>,
  deck: Deck
): Promise<void> {
  const paths = deck.cards
    .map((card) => card.attachment?.storagePath)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await client.storage.from(MINDRE_BUCKET).remove(paths);
    if (storageError) throw storageError;
  }

  const { error } = await client.from('decks').delete().eq('id', deck.id);
  if (error) throw error;
}
