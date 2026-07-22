export type CardType = 'text' | 'code';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardProgress {
  userId: string;
  cardId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardAttachment {
  id: string;
  cardId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  frontType: CardType;
  backType: CardType;
  language?: string;
  createdAt: string;
  updatedAt: string;
  progress: CardProgress | null;
  attachment: CardAttachment | null;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreData {
  decks: Deck[];
  loading: boolean;
  saving: boolean;
  initialized: boolean;
  error: string | null;
  success: string | null;
}

export interface LocalCard {
  id?: string;
  front: string;
  back: string;
  frontType?: CardType;
  backType?: CardType;
  language?: string;
  createdAt?: number;
}

export interface LocalDeck {
  id?: string;
  name: string;
  cards: LocalCard[];
  createdAt?: number;
}

export interface LocalStoreData {
  decks: LocalDeck[];
}
