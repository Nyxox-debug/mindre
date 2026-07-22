import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';
import type { Card, CardProgress, CardType, ReviewRating } from '$lib/types';
import { scheduleReview } from '$lib/spaced-repetition';
import { mapCard, mapProgress } from './mappers';

const CARD_SELECT = `
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
`;

export interface CardInput {
  front: string;
  back: string;
  frontType: CardType;
  backType: CardType;
  language?: string;
}

export async function createCard(
  client: SupabaseClient<Database>,
  userId: string,
  deckId: string,
  input: CardInput
): Promise<Card> {
  const { data, error } = await client
    .from('cards')
    .insert({
      user_id: userId,
      deck_id: deckId,
      front: input.front,
      back: input.back,
      front_type: input.frontType,
      back_type: input.backType,
      language: input.language ?? null
    })
    .select(CARD_SELECT)
    .single();

  if (error) throw error;
  return mapCard(data);
}

export async function updateCard(
  client: SupabaseClient<Database>,
  cardId: string,
  input: CardInput
): Promise<Card> {
  const { data, error } = await client
    .from('cards')
    .update({
      front: input.front,
      back: input.back,
      front_type: input.frontType,
      back_type: input.backType,
      language: input.language ?? null
    })
    .eq('id', cardId)
    .select(CARD_SELECT)
    .single();

  if (error) throw error;
  return mapCard(data);
}

export async function deleteCard(
  client: SupabaseClient<Database>,
  card: Card
): Promise<void> {
  if (card.attachment) {
    const { error: storageError } = await client.storage
      .from('mindre-files')
      .remove([card.attachment.storagePath]);
    if (storageError) throw storageError;
  }

  const { error } = await client.from('cards').delete().eq('id', card.id);
  if (error) throw error;
}

export async function saveReview(
  client: SupabaseClient<Database>,
  userId: string,
  card: Card,
  rating: ReviewRating
): Promise<CardProgress> {
  const schedule = scheduleReview(card.progress, rating);
  const { data, error } = await client
    .from('card_progress')
    .upsert(
      {
        user_id: userId,
        card_id: card.id,
        repetitions: schedule.repetitions,
        interval_days: schedule.intervalDays,
        ease_factor: schedule.easeFactor,
        due_at: schedule.dueAt,
        last_reviewed_at: schedule.lastReviewedAt
      },
      { onConflict: 'user_id,card_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapProgress(data);
}
