<script>
	import { flashcardStore } from '$lib/stores.js';
	
	let showNewDeckForm = false;
	let newDeckName = '';
	let decks = [];
	let confirmDelete = null;
	
	flashcardStore.subscribe(data => {
		decks = data.decks;
	});
	
	function createDeck() {
		if (newDeckName.trim()) {
			flashcardStore.addDeck(newDeckName.trim());
			newDeckName = '';
			showNewDeckForm = false;
		}
	}
	
	function deleteDeck(id) {
		if (confirmDelete === id) {
			flashcardStore.deleteDeck(id);
			confirmDelete = null;
		} else {
			confirmDelete = id;
			setTimeout(() => {
				confirmDelete = null;
			}, 3000);
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Enter' && newDeckName.trim()) {
			createDeck();
		}
		if (event.key === 'Escape') {
			showNewDeckForm = false;
			newDeckName = '';
			confirmDelete = null;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="home">
	<div class="actions">
		{#if !showNewDeckForm}
			<button on:click={() => showNewDeckForm = true}>
				+ New Deck
			</button>
		{:else}
			<div class="new-deck-form">
				<input
					type="text"
					bind:value={newDeckName}
					placeholder="Deck name..."
					autofocus
				/>
				<button on:click={createDeck}>Create</button>
				<button on:click={() => { showNewDeckForm = false; newDeckName = ''; }}>
					Cancel
				</button>
			</div>
		{/if}
	</div>
	
	{#if decks.length === 0}
		<div class="empty-state">
			<p>No decks yet. Create one.</p>
		</div>
	{:else}
		<div class="deck-grid">
			{#each decks as deck (deck.id)}
				<a href="/deck/{deck.id}" class="deck-card">
					<h3>{deck.name}</h3>
					<p class="card-count">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</p>
				</a>
			{/each}
		</div>
	{/if}
	
	{#if decks.length > 0}
		<div class="deck-list">
			{#each decks as deck (deck.id)}
				<div class="deck-item">
					<a href="/deck/{deck.id}" class="deck-link">
						<span class="deck-name">{deck.name}</span>
						<span class="deck-count">({deck.cards.length})</span>
					</a>
					<button 
						class="delete-btn" 
						class:confirm={confirmDelete === deck.id}
						on:click|preventDefault={() => deleteDeck(deck.id)}
					>
						{confirmDelete === deck.id ? 'Confirm?' : 'Delete'}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-md);
	}
	
	.new-deck-form {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}
	
	.new-deck-form input {
		flex: 1;
		min-width: 200px;
	}
	
	.empty-state {
		color: var(--placeholder);
		padding: var(--space-xl);
		text-align: center;
		border: 1px dashed var(--border);
	}
	
	.deck-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--space-md);
	}
	
	.deck-card {
		display: block;
		padding: var(--space-lg);
		border: 1px solid var(--border);
		text-decoration: none;
		transition: all 0.2s ease;
	}
	
	.deck-card:hover {
		border-color: var(--accent);
		box-shadow: 0 0 10px var(--accent-dim);
		text-decoration: none;
	}
	
	.deck-card h3 {
		margin-bottom: var(--space-sm);
		word-break: break-word;
	}
	
	.card-count {
		color: var(--placeholder);
		font-size: 0.875rem;
	}
	
	.deck-list {
		margin-top: var(--space-xl);
		border-top: 1px solid var(--border);
		padding-top: var(--space-lg);
	}
	
	.deck-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--border);
	}
	
	.deck-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		color: var(--fg);
		text-decoration: none;
	}
	
	.deck-link:hover {
		color: var(--accent);
		text-decoration: none;
	}
	
	.deck-name {
		word-break: break-word;
	}
	
	.deck-count {
		color: var(--placeholder);
		font-size: 0.875rem;
	}
	
	.delete-btn {
		font-size: 0.875rem;
		padding: var(--space-xs) var(--space-sm);
		color: var(--danger);
		border-color: var(--danger);
	}
	
	.delete-btn:hover {
		background: var(--danger);
		color: var(--bg);
		box-shadow: 0 0 10px var(--danger);
	}
	
	.delete-btn.confirm {
		background: var(--danger);
		color: var(--bg);
	}
</style>