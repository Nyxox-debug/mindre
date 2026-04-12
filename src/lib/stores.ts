// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { StoreData, CardType } from './types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function createFlashcardStore() {
  const STORAGE_KEY = 'mindre-cache';

  let initialData: StoreData = { decks: [] };
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) initialData = JSON.parse(cached);
    } catch { }
  }

  const { subscribe, set, update } = writable<StoreData>(initialData);

  async function persist(data: StoreData): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return {
    subscribe,

    addDeck: (name: string): void => {
      let saved!: StoreData;
      update(data => {
        const newDeck = {
          id: generateId(),
          name,
          cards: [],
          createdAt: Date.now()
        };
        saved = { decks: [...data.decks, newDeck] };
        return saved;
      });
      persist(saved);
    },

    deleteDeck: (deckId: string): void => {
      let saved!: StoreData;
      update(data => {
        saved = { decks: data.decks.filter(d => d.id !== deckId) };
        return saved;
      });
      persist(saved);
    },

    addCard: (
      deckId: string,
      front: string,
      back: string,
      frontType: CardType = 'text',
      backType: CardType = 'text',
      language = 'javascript'
    ): void => {
      let saved!: StoreData;
      update(data => {
        const newCard = {
          id: generateId(),
          front,
          back,
          frontType,
          backType,
          language,
          createdAt: Date.now()
        };
        saved = {
          decks: data.decks.map(d =>
            d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
          )
        };
        return saved;
      });
      persist(saved);
    },

    deleteCard: (deckId: string, cardId: string): void => {
      let saved!: StoreData;
      update(data => {
        saved = {
          decks: data.decks.map(d =>
            d.id === deckId
              ? { ...d, cards: d.cards.filter(c => c.id !== cardId) }
              : d
          )
        };
        return saved;
      });
      persist(saved);
    },

    updateCard: (
      deckId: string,
      cardId: string,
      front: string,
      back: string,
      frontType: CardType = 'text',
      backType: CardType = 'text',
      language = 'javascript'
    ): void => {
      let saved!: StoreData;
      update(data => {
        saved = {
          decks: data.decks.map(d =>
            d.id === deckId
              ? {
                ...d,
                cards: d.cards.map(c =>
                  c.id === cardId
                    ? { ...c, front, back, frontType, backType, language }
                    : c
                )
              }
              : d
          )
        };
        return saved;
      });
      persist(saved);
    }
  };
}

export const flashcardStore = createFlashcardStore();
