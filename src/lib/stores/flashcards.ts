import { get, writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';
import type { Card, CardAttachment, CardProgress, CardType, Deck, ReviewRating, StoreData } from '$lib/types';
import * as deckService from '$lib/services/decks';
import * as cardService from '$lib/services/cards';
import * as attachmentService from '$lib/services/attachments';

const initialState: StoreData = {
  decks: [],
  loading: true,
  saving: false,
  initialized: false,
  error: null,
  success: null
};

let client: SupabaseClient<Database> | null = null;
let userId: string | null = null;
let initializePromise: Promise<void> | null = null;

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return 'An unexpected network error occurred.';
}

function createFlashcardStore() {
  const store = writable<StoreData>(initialState);
  const { subscribe, set, update } = store;

  function requireContext(): { client: SupabaseClient<Database>; userId: string } {
    if (!client || !userId) throw new Error('Your authenticated session is not ready.');
    return { client, userId };
  }

  function replaceDeck(nextDeck: Deck): void {
    update((state) => ({
      ...state,
      decks: state.decks.some((deck) => deck.id === nextDeck.id)
        ? state.decks.map((deck) => (deck.id === nextDeck.id ? nextDeck : deck))
        : [...state.decks, nextDeck]
    }));
  }

  function replaceCard(deckId: string, nextCard: Card): void {
    update((state) => ({
      ...state,
      decks: state.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.some((card) => card.id === nextCard.id)
                ? deck.cards.map((card) => (card.id === nextCard.id ? nextCard : card))
                : [...deck.cards, nextCard]
            }
          : deck
      )
    }));
  }

  async function mutate<T>(action: () => Promise<T>, success?: string): Promise<T> {
    update((state) => ({ ...state, saving: true, error: null, success: null }));
    try {
      const result = await action();
      update((state) => ({ ...state, saving: false, success: success ?? null }));
      return result;
    } catch (error) {
      update((state) => ({ ...state, saving: false, error: message(error) }));
      throw error;
    }
  }

  return {
    subscribe,
    async initialize(supabase: SupabaseClient<Database>, authenticatedUserId: string) {
      if (client === supabase && userId === authenticatedUserId && get(store).initialized) return;
      if (initializePromise) return initializePromise;

      client = supabase;
      userId = authenticatedUserId;
      initializePromise = (async () => {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
          const decks = await deckService.fetchDecks(supabase);
          set({ ...initialState, decks, loading: false, initialized: true });
        } catch (error) {
          set({ ...initialState, loading: false, initialized: true, error: message(error) });
        } finally {
          initializePromise = null;
        }
      })();
      return initializePromise;
    },
    async refresh() {
      const context = requireContext();
      update((state) => ({ ...state, loading: true, error: null }));
      try {
        const decks = await deckService.fetchDecks(context.client);
        update((state) => ({ ...state, decks, loading: false, initialized: true }));
      } catch (error) {
        update((state) => ({ ...state, loading: false, error: message(error) }));
        throw error;
      }
    },
    async loadDeck(deckId: string): Promise<Deck | null> {
      const context = requireContext();
      update((state) => ({ ...state, error: null }));
      try {
        const deck = await deckService.fetchDeck(context.client, deckId);
        if (deck) replaceDeck(deck);
        return deck;
      } catch (error) {
        update((state) => ({ ...state, error: message(error) }));
        throw error;
      }
    },
    async addDeck(name: string): Promise<Deck> {
      const context = requireContext();
      return mutate(async () => {
        const deck = await deckService.createDeck(context.client, context.userId, name);
        replaceDeck(deck);
        return deck;
      }, 'Deck created.');
    },
    async renameDeck(deckId: string, name: string): Promise<void> {
      const context = requireContext();
      await mutate(async () => {
        await deckService.renameDeck(context.client, deckId, name);
        update((state) => ({
          ...state,
          decks: state.decks.map((deck) =>
            deck.id === deckId ? { ...deck, name, updatedAt: new Date().toISOString() } : deck
          )
        }));
      }, 'Deck renamed.');
    },
    async deleteDeck(deckId: string): Promise<void> {
      const context = requireContext();
      const deck = get(store).decks.find((item) => item.id === deckId);
      if (!deck) throw new Error('Deck not found.');
      await mutate(async () => {
        await deckService.deleteDeck(context.client, deck);
        update((state) => ({ ...state, decks: state.decks.filter((item) => item.id !== deckId) }));
      }, 'Deck deleted.');
    },
    async addCard(
      deckId: string,
      front: string,
      back: string,
      frontType: CardType = 'text',
      backType: CardType = 'text',
      language = 'javascript'
    ): Promise<Card> {
      const context = requireContext();
      return mutate(async () => {
        const card = await cardService.createCard(context.client, context.userId, deckId, {
          front,
          back,
          frontType,
          backType,
          language
        });
        replaceCard(deckId, card);
        return card;
      }, 'Card created.');
    },
    async updateCard(
      deckId: string,
      cardId: string,
      front: string,
      back: string,
      frontType: CardType = 'text',
      backType: CardType = 'text',
      language = 'javascript'
    ): Promise<Card> {
      const context = requireContext();
      return mutate(async () => {
        const current = get(store).decks
          .find((deck) => deck.id === deckId)
          ?.cards.find((card) => card.id === cardId);
        const card = await cardService.updateCard(context.client, cardId, {
          front,
          back,
          frontType,
          backType,
          language
        });
        const merged = { ...card, progress: current?.progress ?? card.progress, attachment: current?.attachment ?? card.attachment };
        replaceCard(deckId, merged);
        return merged;
      }, 'Card updated.');
    },
    async deleteCard(deckId: string, cardId: string): Promise<void> {
      const context = requireContext();
      const card = get(store).decks
        .find((deck) => deck.id === deckId)
        ?.cards.find((item) => item.id === cardId);
      if (!card) throw new Error('Card not found.');
      await mutate(async () => {
        await cardService.deleteCard(context.client, card);
        update((state) => ({
          ...state,
          decks: state.decks.map((deck) =>
            deck.id === deckId
              ? { ...deck, cards: deck.cards.filter((item) => item.id !== cardId) }
              : deck
          )
        }));
      }, 'Card deleted.');
    },
    async reviewCard(deckId: string, cardId: string, rating: ReviewRating): Promise<CardProgress> {
      const context = requireContext();
      const card = get(store).decks
        .find((deck) => deck.id === deckId)
        ?.cards.find((item) => item.id === cardId);
      if (!card) throw new Error('Card not found.');
      return mutate(async () => {
        const progress = await cardService.saveReview(context.client, context.userId, card, rating);
        replaceCard(deckId, { ...card, progress });
        return progress;
      });
    },
    async uploadAttachment(deckId: string, cardId: string, file: File): Promise<void> {
      const context = requireContext();
      const card = get(store).decks
        .find((deck) => deck.id === deckId)
        ?.cards.find((item) => item.id === cardId);
      if (!card) throw new Error('Card not found.');
      await mutate(async () => {
        const attachment = await attachmentService.uploadAttachment(
          context.client,
          context.userId,
          deckId,
          cardId,
          file,
          card.attachment
        );
        replaceCard(deckId, { ...card, attachment });
      }, 'Attachment saved.');
    },
    async removeAttachment(deckId: string, cardId: string): Promise<void> {
      const context = requireContext();
      const card = get(store).decks
        .find((deck) => deck.id === deckId)
        ?.cards.find((item) => item.id === cardId);
      if (!card?.attachment) return;
      await mutate(async () => {
        await attachmentService.removeAttachment(context.client, card.attachment!);
        replaceCard(deckId, { ...card, attachment: null });
      }, 'Attachment removed.');
    },
    async downloadAttachment(attachment: CardAttachment): Promise<void> {
      const context = requireContext();
      update((state) => ({ ...state, error: null }));
      try {
        await attachmentService.downloadAttachment(context.client, attachment);
      } catch (error) {
        update((state) => ({ ...state, error: message(error) }));
        throw error;
      }
    },
    clearMessages() {
      update((state) => ({ ...state, error: null, success: null }));
    },
    reset() {
      client = null;
      userId = null;
      initializePromise = null;
      set(initialState);
    }
  };
}

export const flashcardStore = createFlashcardStore();
