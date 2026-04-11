<script>
	import { page } from '$app/stores';
	import { flashcardStore } from '$lib/stores.js';
	import { onMount } from 'svelte';
	
	let deck = null;
	let showAddCardForm = false;
	let cardFront = '';
	let cardBack = '';
	let confirmDeleteCard = null;
	
	$: deckId = $page.params.id;
	
	onMount(() => {
		const unsubscribe = flashcardStore.subscribe(data => {
			deck = data.decks.find(d => d.id === deckId);
		});
		return unsubscribe;
	});
	
	function addCard() {
		if (cardFront.trim() && cardBack.trim()) {
			flashcardStore.addCard(deckId, cardFront.trim(), cardBack.trim());
			cardFront = '';
			cardBack = '';
			showAddCardForm = false;
		}
	}
	
	function deleteCard(cardId) {
		if (confirmDeleteCard === cardId) {
			flashcardStore.deleteCard(deckId, cardId);
			confirmDeleteCard = null;
		} else {
			confirmDeleteCard = cardId;
			setTimeout(() => {
				confirmDeleteCard = null;
			}, 3000);
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			showAddCardForm = false;
			cardFront = '';
			cardBack = '';
			confirmDeleteCard = null;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="deck-view">
	{#if !deck}
		<p>Deck not found.</p>
	{:else}
		<div class="deck-header">
			<a href="/" class="back-link">&larr; Back</a>
			<h2>{deck.name}</h2>
		</div>
		
		<div class="actions">
			{#if deck.cards.length > 0}
				<a href="/study/{deckId}" class="study-btn">Study</a>
			{/if}
			
			{#if !showAddCardForm}
				<button on:click={() => showAddCardForm = true}>
					+ Add Card
				</button>
			{:else}
				<div class="add-card-form">
					<textarea
						bind:value={cardFront}
						placeholder="Front (question)..."
						rows="2"
						autofocus
					></textarea>
					<textarea
						bind:value={cardBack}
						placeholder="Back (answer)..."
						rows="2"
					></textarea>
					<div class="form-actions">
						<button on:click={addCard}>Add</button>
						<button on:click={() => { showAddCardForm = false; cardFront = ''; cardBack = ''; }}>
							Cancel
						</button>
					</div>
				</div>
			{/if}
		</div>
		
		{#if deck.cards.length === 0 && !showAddCardForm}
			<div class="empty-state">
				<p>No cards yet. Add some cards to start studying.</p>
			</div>
		{:else}
			<div class="card-list">
				{#each deck.cards as card, index (card.id)}
					<div class="card-item">
						<div class="card-content">
							<span class="card-num">{index + 1}.</span>
							<div class="card-text">
								<p class="card-front"><strong>Front:</strong> {card.front}</p>
								<p class="card-back"><strong>Back:</strong> {card.back}</p>
							</div>
						</div>
						<button 
							class="delete-card-btn"
							class:confirm={confirmDeleteCard === card.id}
							on:click={() => deleteCard(card.id)}
						>
							{confirmDeleteCard === card.id ? 'Confirm?' : 'Delete'}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.deck-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	
	.deck-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	
	.back-link {
		color: var(--placeholder);
		font-size: 0.875rem;
	}
	
	.back-link:hover {
		color: var(--accent);
	}
	
	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	
	.study-btn {
		display: inline-block;
		text-align: center;
		background: var(--accent);
		color: var(--bg);
		padding: var(--space-sm) var(--space-md);
		text-decoration: none;
	}
	
	.study-btn:hover {
		box-shadow: 0 0 10px var(--accent);
		text-decoration: none;
	}
	
	.add-card-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--border);
	}
	
	.add-card-form textarea {
		resize: vertical;
		min-height: 60px;
	}
	
	.form-actions {
		display: flex;
		gap: var(--space-sm);
	}
	
	.empty-state {
		color: var(--placeholder);
		padding: var(--space-xl);
		text-align: center;
		border: 1px dashed var(--border);
	}
	
	.card-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	
	.card-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--border);
	}
	
	.card-content {
		display: flex;
		gap: var(--space-md);
		flex: 1;
		min-width: 0;
	}
	
	.card-num {
		color: var(--placeholder);
		flex-shrink: 0;
	}
	
	.card-text {
		flex: 1;
		min-width: 0;
	}
	
	.card-front, .card-back {
		word-break: break-word;
	}
	
	.card-front {
		margin-bottom: var(--space-xs);
	}
	
	.card-back {
		color: var(--placeholder);
	}
	
	.delete-card-btn {
		font-size: 0.875rem;
		padding: var(--space-xs) var(--space-sm);
		color: var(--danger);
		border-color: var(--danger);
		flex-shrink: 0;
	}
	
	.delete-card-btn:hover {
		background: var(--danger);
		color: var(--bg);
		box-shadow: 0 0 10px var(--danger);
	}
	
	.delete-card-btn.confirm {
		background: var(--danger);
		color: var(--bg);
	}
</style>