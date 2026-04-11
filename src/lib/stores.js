import { writable } from 'svelte/store';

function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function createFlashcardStore() {
	const STORAGE_KEY = 'mindre-cache';

	// Seed from localStorage as instant cache while KV loads
	let initialData = { decks: [] };
	if (typeof window !== 'undefined') {
		try {
			const cached = localStorage.getItem(STORAGE_KEY);
			if (cached) initialData = JSON.parse(cached);
		} catch {}
	}

	const { subscribe, set, update } = writable(initialData);
	let syncing = false;

	// Write to KV (debounced) + update localStorage cache
	async function persist(data) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

	}

	// Load from KV on startup
	async function loadFromServer() {
		if (typeof window === 'undefined') return;
		try {
			const res = await fetch('/api/decks');
			if (res.ok) {
				const data = await res.json();
				set(data);
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			}
		} catch (e) {
			console.warn('Could not reach server, using local cache');
		}
	}

	return {
		subscribe,
		loadFromServer,

		addDeck: (name) => {
			let saved;
			update(data => {
				const newDeck = { id: generateId(), name, cards: [] };
				saved = { decks: [...data.decks, newDeck] };
				return saved;
			});
			persist(saved);
		},

		deleteDeck: (deckId) => {
			let saved;
			update(data => {
				saved = { decks: data.decks.filter(d => d.id !== deckId) };
				return saved;
			});
			persist(saved);
		},

		addCard: (deckId, front, back) => {
			let saved;
			update(data => {
				const newCard = { id: generateId(), front, back };
				saved = {
					decks: data.decks.map(d =>
						d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
					)
				};
				return saved;
			});
			persist(saved);
		},

		deleteCard: (deckId, cardId) => {
			let saved;
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

		updateCard: (deckId, cardId, front, back) => {
			let saved;
			update(data => {
				saved = {
					decks: data.decks.map(d =>
						d.id === deckId
							? { ...d, cards: d.cards.map(c => c.id === cardId ? { ...c, front, back } : c) }
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
