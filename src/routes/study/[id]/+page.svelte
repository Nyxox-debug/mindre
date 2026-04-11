<script>
	import { page } from '$app/stores';
	import { flashcardStore } from '$lib/stores.js';
	import { onMount } from 'svelte';

	let deck = null;
	let currentIndex = 0;
	let isFlipped = false;
	let shuffled = false;
	let cards = [];
	let done = false;

	$: deckId = $page.params.id;
	$: currentCard = cards[currentIndex] || null;
	$: total = cards.length;
	$: progress = total > 0 ? ((currentIndex + (isFlipped ? 0.5 : 0)) / total) * 100 : 0;

	onMount(() => {
		const unsub = flashcardStore.subscribe(data => {
			deck = data.decks.find(d => d.id === deckId);
			if (deck) cards = [...deck.cards];
		});
		return unsub;
	});

	function shuffle() {
		cards = [...cards].sort(() => Math.random() - 0.5);
		currentIndex = 0;
		isFlipped = false;
		done = false;
		shuffled = true;
	}

	function reset() {
		cards = deck ? [...deck.cards] : [];
		currentIndex = 0;
		isFlipped = false;
		done = false;
		shuffled = false;
	}

	function flip() {
		isFlipped = !isFlipped;
	}

	function prev() {
		if (currentIndex > 0) {
			currentIndex--;
			isFlipped = false;
			done = false;
		}
	}

	function next() {
		if (currentIndex < total - 1) {
			currentIndex++;
			isFlipped = false;
		} else if (!done) {
			done = true;
		}
	}

	function handleKey(e) {
		if (done) {
			if (e.key === 'r' || e.key === 'R') reset();
			return;
		}
		if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flip(); }
		else if (e.key === 'ArrowLeft') prev();
		else if (e.key === 'ArrowRight') next();
		else if (e.key === 'Escape') window.location.href = `/deck/${deckId}`;
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="study-page">
	{#if !deck || deck.cards.length === 0}
		<div class="empty">
			<p>No cards to study.</p>
			<a href="/deck/{deckId}">← back to deck</a>
		</div>
	{:else if done}
		<!-- Done screen -->
		<div class="done-screen">
			<div class="done-icon">✓</div>
			<h2>Done!</h2>
			<p class="done-sub">You studied all {total} card{total !== 1 ? 's' : ''}.</p>
			<div class="done-actions">
				<button class="primary" on:click={reset}>restart</button>
				<button on:click={shuffle}>shuffle</button>
				<a href="/deck/{deckId}" class="done-back">← back to deck</a>
			</div>
		</div>
	{:else}
		<!-- Progress bar -->
		<div class="progress-bar-wrap">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {(currentIndex / total) * 100}%"></div>
			</div>
		</div>

		<!-- Header -->
		<div class="study-header">
			<a href="/deck/{deckId}" class="exit">← exit</a>
			<div class="study-info">
				<span class="deck-name-label">{deck.name}</span>
				<span class="counter">{currentIndex + 1} <span class="counter-sep">/</span> {total}</span>
			</div>
			<button class="shuffle-btn" on:click={shuffle} title="Shuffle cards">
				{shuffled ? '✓ shuffled' : '⇄ shuffle'}
			</button>
		</div>

		<!-- Card -->
		<div
			class="card-scene"
			on:click={flip}
			on:keydown={e => e.key === 'Enter' && flip()}
			role="button"
			tabindex="0"
			aria-label="Flashcard — click to flip"
		>
			<div class="card-3d" class:flipped={isFlipped}>
				<div class="card-face front">
					<span class="face-label">front</span>
					<p class="card-text">{currentCard?.front}</p>
					<span class="flip-hint">click to reveal →</span>
				</div>
				<div class="card-face back">
					<span class="face-label">back</span>
					<p class="card-text">{currentCard?.back}</p>
					<span class="flip-hint">← click to flip back</span>
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls">
			<button on:click={prev} disabled={currentIndex === 0}>← prev</button>
			<div class="dots">
				{#each cards as _, i}
					<span
						class="dot"
						class:active={i === currentIndex}
						class:past={i < currentIndex}
					></span>
				{/each}
			</div>
			<button class="primary" on:click={next}>
				{currentIndex === total - 1 ? 'finish ✓' : 'next →'}
			</button>
		</div>

		<!-- Keyboard hints -->
		<div class="kbd-hints">
			<kbd>←</kbd> prev
			<kbd>space</kbd> flip
			<kbd>→</kbd> next
			<kbd>esc</kbd> exit
		</div>
	{/if}
</div>

<style>
	.study-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		min-height: calc(100vh - 220px);
		justify-content: center;
	}

	/* ── Progress bar ────────────────────────── */
	.progress-bar-wrap {
		width: 100%;
		max-width: 600px;
	}

	.progress-bar {
		height: 2px;
		background: var(--border);
		border-radius: 1px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 1px;
		transition: width 0.3s ease;
	}

	/* ── Header ──────────────────────────────── */
	.study-header {
		width: 100%;
		max-width: 600px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.exit {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--fg-4);
		text-decoration: none;
		transition: color 0.15s;
		white-space: nowrap;
	}
	.exit:hover { color: var(--accent); }

	.study-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.deck-name-label {
		font-size: 11px;
		color: var(--fg-4);
		letter-spacing: 0.06em;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		max-width: 200px;
	}

	.counter {
		font-size: 13px;
		font-weight: 700;
		color: var(--fg);
		letter-spacing: 0.04em;
	}
	.counter-sep { color: var(--fg-4); }

	.shuffle-btn {
		font-size: 10px;
		padding: 5px 10px;
		white-space: nowrap;
	}

	/* ── 3D Card ─────────────────────────────── */
	.card-scene {
		perspective: 1200px;
		width: 100%;
		max-width: 600px;
		height: 320px;
		cursor: pointer;
		outline: none;
	}

	.card-scene:focus-visible .card-3d {
		box-shadow: 0 0 0 2px var(--accent);
	}

	.card-3d {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
		transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: var(--radius);
	}

	.card-3d.flipped { transform: rotateY(180deg); }

	.card-face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		border-radius: var(--radius);
		background: var(--bg-1);
		border: 1px solid var(--border-2);
		gap: 16px;
	}

	.card-face.front { border-color: var(--accent); }
	.card-face.back {
		transform: rotateY(180deg);
		border-color: var(--border-2);
		background: var(--bg-2);
	}

	.face-label {
		position: absolute;
		top: 14px;
		left: 18px;
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--fg-4);
	}

	.card-face.front .face-label { color: var(--accent); }

	.card-text {
		font-size: 18px;
		line-height: 1.5;
		text-align: center;
		word-break: break-word;
		color: var(--fg);
		max-width: 480px;
	}

	.flip-hint {
		position: absolute;
		bottom: 14px;
		font-size: 10px;
		letter-spacing: 0.08em;
		color: var(--fg-4);
		text-transform: uppercase;
	}

	/* ── Controls ────────────────────────────── */
	.controls {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 100%;
		max-width: 600px;
	}

	.controls button { min-width: 90px; }

	.dots {
		flex: 1;
		display: flex;
		gap: 5px;
		justify-content: center;
		flex-wrap: wrap;
		max-height: 32px;
		overflow: hidden;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--border-2);
		transition: background 0.2s;
		flex-shrink: 0;
	}

	.dot.active { background: var(--accent); }
	.dot.past { background: var(--fg-4); }

	/* ── Keyboard hints ──────────────────────── */
	.kbd-hints {
		display: flex;
		gap: 16px;
		font-size: 10px;
		color: var(--fg-4);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		align-items: center;
	}

	kbd {
		background: var(--bg-2);
		border: 1px solid var(--border-2);
		border-radius: 2px;
		padding: 1px 5px;
		font-family: var(--font);
		font-size: 10px;
		color: var(--fg-3);
	}

	/* ── Done screen ─────────────────────────── */
	.done-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		text-align: center;
	}

	.done-icon {
		font-size: 40px;
		color: var(--accent);
		animation: pop 0.4s ease;
	}

	@keyframes pop {
		0% { transform: scale(0.5); opacity: 0; }
		70% { transform: scale(1.2); }
		100% { transform: scale(1); opacity: 1; }
	}

	.done-screen h2 { font-size: 24px; }
	.done-sub { color: var(--fg-4); font-size: 13px; }

	.done-actions {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 8px;
	}

	.done-back {
		font-size: 12px;
		color: var(--fg-4);
		letter-spacing: 0.06em;
	}

	/* ── Empty ───────────────────────────────── */
	.empty {
		text-align: center;
		color: var(--fg-4);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* ── Responsive ──────────────────────────── */
	@media (max-width: 600px) {
		.card-scene { height: 260px; }
		.card-text { font-size: 15px; }
		.card-face { padding: 28px 24px; }
		.kbd-hints { display: none; }
		.deck-name-label { display: none; }
	}
</style>
