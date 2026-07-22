import type { Card, CardAttachment, CardProgress, Deck, Profile } from '$lib/types';

export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapProgress(row: any): CardProgress {
  return {
    userId: row.user_id,
    cardId: row.card_id,
    repetitions: row.repetitions,
    intervalDays: row.interval_days,
    easeFactor: Number(row.ease_factor),
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAttachment(row: any): CardAttachment {
  return {
    id: row.id,
    cardId: row.card_id,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at
  };
}

export function mapCard(row: any): Card {
  const progressRow = Array.isArray(row.card_progress) ? row.card_progress[0] : row.card_progress;
  const attachmentRow = Array.isArray(row.card_attachments)
    ? row.card_attachments[0]
    : row.card_attachments;

  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    frontType: row.front_type,
    backType: row.back_type,
    language: row.language ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progress: progressRow ? mapProgress(progressRow) : null,
    attachment: attachmentRow ? mapAttachment(attachmentRow) : null
  };
}

export function mapDeck(row: any): Deck {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cards: (row.cards ?? []).map(mapCard).sort((a: Card, b: Card) =>
      a.createdAt.localeCompare(b.createdAt)
    )
  };
}
