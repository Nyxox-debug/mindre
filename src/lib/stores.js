import { writable } from 'svelte/store';

function generateId() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function createFlashcardStore() {
	const STORAGE_KEY = 'mindre-data';
	
	let initialData = { decks: [] };
	
	if (typeof window !== 'undefined' && window.localStorage) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				initialData = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse stored data:', e);
			}
		}
	}
	
	const { subscribe, set, update } = writable(initialData);
	
	function persist(data) {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
	}
	
	return {
		subscribe,
		
		addDeck: (name) => {
			update(data => {
				const newDeck = {
					id: generateId(),
					name: name,
					cards: []
				};
				const newData = { decks: [...data.decks, newDeck] };
				persist(newData);
				return newData;
			});
		},
		
		deleteDeck: (deckId) => {
			update(data => {
				const newData = { decks: data.decks.filter(d => d.id !== deckId) };
				persist(newData);
				return newData;
			});
		},
		
		addCard: (deckId, front, back) => {
			update(data => {
				const newCard = {
					id: generateId(),
					front: front,
					back: back
				};
				const newData = {
					decks: data.decks.map(d => {
						if (d.id === deckId) {
							return { ...d, cards: [...d.cards, newCard] };
						}
						return d;
					})
				};
				persist(newData);
				return newData;
			});
		},
		
		deleteCard: (deckId, cardId) => {
			update(data => {
				const newData = {
					decks: data.decks.map(d => {
						if (d.id === deckId) {
							return { ...d, cards: d.cards.filter(c => c.id !== cardId) };
						}
						return d;
					})
				};
				persist(newData);
				return newData;
			});
		},
		
		getDeck: (deckId) => {
			let deck = null;
			update(data => {
				deck = data.decks.find(d => d.id === deckId);
				return data;
			});
			return deck;
		}
	};
}

export const flashcardStore = createFlashcardStore();