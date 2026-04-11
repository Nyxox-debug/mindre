<script>
	import { page } from '$app/stores';
	import { flashcardStore } from '$lib/stores.js';
	import { onMount } from 'svelte';
	
	let deck = null;
	let currentIndex = 0;
	let isFlipped = false;
	
	$: deckId = $page.params.id;
	$: currentCard = deck?.cards[currentIndex] || null;
	$: totalCards = deck?.cards.length || 0;
	
	onMount(() => {
		const unsubscribe = flashcardStore.subscribe(data => {
			deck = data.decks.find(d => d.id === deckId);
		});
		return unsubscribe;
	});
	
	function flipCard() {
		isFlipped = !isFlipped;
	}
	
	function prevCard() {
		if (currentIndex > 0) {
			currentIndex--;
			isFlipped = false;
		}
	}
	
	function nextCard() {
		if (currentIndex < totalCards - 1) {
			currentIndex++;
			isFlipped = false;
		}
	}
	
	function handleKeydown(event) {
		if (event.key === ' ' || event.key === 'Spacebar') {
			event.preventDefault();
			flipCard();
		} else if (event.key === 'ArrowLeft') {
			prevCard();
		} else if (event.key === 'ArrowRight') {
			nextCard();
		} else if (event.key === 'Escape') {
			window.location.href = `/deck/${deckId}`;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="study-mode">
	{#if !deck || deck.cards.length === 0}
		<div class="empty-state">
			<p>No cards to study.</p>
			<a href="/deck/{deckId}">Back to deck</a>
		</div>
	{:else}
		<div class="study-header">
			<a href="/deck/{deckId}" class="exit-btn">&larr; Exit</a>
			<span class="progress">Card {currentIndex + 1} / {totalCards}</span>
		</div>
		
		<div class="flashcard-container" on:click={flipCard} on:keydown={flipCard} role="button" tabindex="0">
			<div class="flashcard" class:flipped={isFlipped}>
				<div class="card-face card-front">
					<p>{currentCard.front}</p>
				</div>
				<div class="card-face card-back">
					<p>{currentCard.back}</p>
				</div>
			</div>
		</div>
		
		<div class="controls">
			<button on:click={prevCard} disabled={currentIndex === 0}>
				&larr; Previous
			</button>
			<span class="hint">Click card or press Space to flip</span>
			<button on:click={nextCard} disabled={currentIndex === totalCards - 1}>
				Next &rarr;
			</button>
		</div>
		
		<div class="keyboard-hints">
			<span>&larr; Prev</span>
			<span>Space: Flip</span>
			<span>Next &rarr;</span>
		</div>
	{/if}
</div>

<style>
	.study-mode {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 200px);
		gap: var(--space-lg);
	}
	
	.empty-state {
		text-align: center;
		color: var(--placeholder);
	}
	
	.empty-state a {
		color: var(--accent);
	}
	
	.study-header {
		width: 100%;
		max-width: 500px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.exit-btn {
		color: var(--placeholder);
		font-size: 0.875rem;
	}
	
	.exit-btn:hover {
		color: var(--accent);
	}
	
	.progress {
		color: var(--accent);
		font-weight: 700;
	}
	
	.flashcard-container {
		perspective: 1000px;
		width: 100%;
		max-width: 500px;
		height: 300px;
		cursor: pointer;
	}
	
	.flashcard {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.flashcard.flipped {
		transform: rotateY(180deg);
	}
	
	.card-face {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		border: 1px solid var(--accent);
		background: var(--bg);
	}
	
	.card-front {
		border-color: var(--accent);
	}
	
	.card-back {
		transform: rotateY(180deg);
		border-color: var(--accent-dim);
	}
	
	.card-face p {
		text-align: center;
		word-break: break-word;
		font-size: 1.25rem;
	}
	
	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		flex-wrap: wrap;
		justify-content: center;
	}
	
	.controls button {
		min-width: 120px;
	}
	
	.hint {
		color: var(--placeholder);
		font-size: 0.875rem;
	}
	
	.keyboard-hints {
		display: flex;
		gap: var(--space-lg);
		color: var(--placeholder);
		font-size: 0.75rem;
	}
	
	.keyboard-hints span {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
	}
	
	@media (max-width: 600px) {
		.flashcard-container {
			height: 250px;
		}
		
		.card-face p {
			font-size: 1rem;
		}
		
		.keyboard-hints {
			display: none;
		}
	}
</style>