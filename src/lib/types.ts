// src/lib/types.ts

export type CardType = 'text' | 'code';

export interface Card {
  id: string;
  front: string;
  back: string;
  frontType: CardType;
  backType: CardType;
  language?: string; // for code cards, e.g. 'javascript', 'python'
  createdAt: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}

export interface StoreData {
  decks: Deck[];
}
