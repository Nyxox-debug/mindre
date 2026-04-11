<script>
	import { page } from '$app/stores';
	import { flashcardStore } from '$lib/stores.js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let deck = null;
	let showAddForm = false;
	let cardFront = '';
	let cardBack = '';
	let confirmDeleteCard = null;
	let editingCard = null;
	let editFront = '';
	let editBack = '';
	let frontInput;

	$: deckId = $page.params.id;

	onMount(() => {
		const unsub = flashcardStore.subscribe(data => {
			deck = data.decks.find(d => d.id === deckId);
		});
		return unsub;
	});

	function addCard() {
		if (cardFront.trim() && cardBack.trim()) {
			flashcardStore.addCard(deckId, cardFront.trim(), cardBack.trim());
			cardFront = '';
			cardBack = '';
			showAddForm = false;
		}
	}

	function deleteCard(cardId) {
		if (confirmDeleteCard === cardId) {
			flashcardStore.deleteCard(deckId, cardId);
			confirmDeleteCard = null;
		} else {
			confirmDeleteCard = cardId;
			setTimeout(() => { confirmDeleteCard = null; }, 3000);
		}
	}

	function startEdit(card) {
		editingCard = card.id;
		editFront = card.front;
		editBack = card.back;
	}

	function saveEdit(cardId) {
		if (editFront.trim() && editBack.trim()) {
			flashcardStore.updateCard(deckId, cardId, editFront.trim(), editBack.trim());
		}
		editingCard = null;
	}

	function openForm() {
		showAddForm = true;
		setTimeout(() => frontInput?.focus(), 50);
	}

	function handleKey(e) {
		if (e.key === 'Escape') {
			showAddForm = false;
			cardFront = '';
			cardBack = '';
			editingCard = null;
			confirmDeleteCard = null;
		}
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="deck-page">
	{#if !deck}
		<p class="not-found">Deck not found. <a href="/">Go home</a></p>
	{:else}
		<!-- Header -->
		<div class="deck-header">
			<a href="/" class="back">← decks</a>
			<div class="header-main">
				<h2 class="deck-title">{deck.name}</h2>
				<span class="deck-badge">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</span>
			</div>
		</div>

		<!-- Actions row -->
		<div class="actions-row">
			{#if deck.cards.length > 0}
				<a href="/study/{deckId}" class="study-link">
					<span>▶ study</span>
				</a>
			{/if}
			<button class="primary" on:click={openForm}>+ add card</button>
		</div>

		<!-- Add card form -->
		{#if showAddForm}
			<div class="add-form">
				<div class="form-label">new card</div>
				<div class="form-row">
					<div class="form-field">
						<label class="field-label">front</label>
						<textarea
							bind:this={frontInput}
							bind:value={cardFront}
							placeholder="Question or term..."
							rows="3"
						></textarea>
					</div>
					<div class="form-divider">→</div>
					<div class="form-field">
						<label class="field-label">back</label>
						<textarea
							bind:value={cardBack}
							placeholder="Answer or definition..."
							rows="3"
						></textarea>
					</div>
				</div>
				<div class="form-actions">
					<button class="primary" on:click={addCard} disabled={!cardFront.trim() || !cardBack.trim()}>
						add card
					</button>
					<button on:click={() => { showAddForm = false; cardFront = ''; cardBack = ''; }}>cancel</button>
				</div>
			</div>
		{/if}

		<!-- Card list -->
		{#if deck.cards.length === 0 && !showAddForm}
			<div class="empty">
				<span class="empty-icon">[ empty ]</span>
				<p>No cards yet. Add your first card above.</p>
			</div>
		{:else}
			<div class="card-list">
				{#each deck.cards as card, i (card.id)}
					<div class="card-row" class:editing={editingCard === card.id}>
						<div class="card-num">{String(i + 1).padStart(2, '0')}</div>

						{#if editingCard === card.id}
							<div class="card-edit">
								<textarea bind:value={editFront} rows="2" placeholder="Front..."></textarea>
								<span class="edit-arrow">→</span>
								<textarea bind:value={editBack} rows="2" placeholder="Back..."></textarea>
								<div class="edit-actions">
									<button class="primary" on:click={() => saveEdit(card.id)}>save</button>
									<button on:click={() => editingCard = null}>cancel</button>
								</div>
							</div>
						{:else}
							<div class="card-content">
								<div class="card-side">
									<span class="side-label">F</span>
									<span class="side-text">{card.front}</span>
								</div>
								<div class="card-sep">→</div>
								<div class="card-side back">
									<span class="side-label">B</span>
									<span class="side-text">{card.back}</span>
								</div>
							</div>
							<div class="card-actions">
								<button class="icon-btn" on:click={() => startEdit(card)} title="Edit">✎</button>
								<button
									class="icon-btn danger-btn"
									class:confirming={confirmDeleteCard === card.id}
									on:click={() => deleteCard(card.id)}
									title="Delete"
								>
									{confirmDeleteCard === card.id ? '?' : '×'}
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.deck-page {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.not-found { color: var(--fg-3); }

	/* ── Header ──────────────────────────────── */
	.deck-header {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.back {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--fg-4);
		text-decoration: none;
		transition: color 0.15s;
	}
	.back:hover { color: var(--accent); }

	.header-main {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}

	.deck-title {
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--fg);
	}

	.deck-badge {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent);
		border: 1px solid var(--accent);
		padding: 2px 8px;
		border-radius: var(--radius);
	}

	/* ── Actions row ─────────────────────────── */
	.actions-row {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.study-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--bg);
		background: var(--accent);
		border: 1px solid var(--accent);
		padding: 8px 16px;
		border-radius: var(--radius);
		text-decoration: none;
		transition: box-shadow 0.15s, opacity 0.15s;
	}
	.study-link:hover {
		box-shadow: 0 0 20px var(--accent-glow);
		opacity: 0.9;
		text-decoration: none;
	}

	/* ── Add form ────────────────────────────── */
	.add-form {
		border: 1px solid var(--border-2);
		border-radius: var(--radius);
		padding: 20px;
		background: var(--bg-1);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.form-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--accent);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 12px;
		align-items: start;
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		.form-divider { display: none; }
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--fg-4);
	}

	.form-divider {
		color: var(--fg-4);
		padding-top: 28px;
		font-size: 14px;
	}

	.form-actions {
		display: flex;
		gap: 8px;
	}

	/* ── Empty ───────────────────────────────── */
	.empty {
		padding: 60px 0;
		text-align: center;
		color: var(--fg-4);
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}
	.empty-icon {
		font-size: 20px;
		letter-spacing: 4px;
	}

	/* ── Card list ───────────────────────────── */
	.card-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.card-row {
		display: flex;
		align-items: stretch;
		gap: 0;
		border-bottom: 1px solid var(--border);
		background: var(--bg-1);
		transition: background 0.15s;
		min-height: 56px;
	}

	.card-row:last-child { border-bottom: none; }
	.card-row:hover { background: var(--bg-2); }
	.card-row.editing { background: var(--bg-2); }

	.card-num {
		font-size: 10px;
		color: var(--fg-4);
		padding: 16px 14px;
		border-right: 1px solid var(--border);
		min-width: 46px;
		display: flex;
		align-items: flex-start;
		letter-spacing: 0.05em;
	}

	.card-content {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 0;
		min-width: 0;
	}

	@media (max-width: 600px) {
		.card-content {
			grid-template-columns: 1fr;
		}
		.card-sep { display: none; }
	}

	.card-side {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 14px 16px;
		min-width: 0;
	}

	.card-side.back {
		border-left: 1px solid var(--border);
	}

	.side-label {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--fg-4);
		padding-top: 2px;
		flex-shrink: 0;
	}

	.side-text {
		font-size: 13px;
		color: var(--fg-2);
		word-break: break-word;
		line-height: 1.5;
	}

	.card-sep {
		color: var(--fg-4);
		padding: 14px 10px;
		font-size: 12px;
		display: flex;
		align-items: flex-start;
		padding-top: 16px;
	}

	.card-actions {
		display: flex;
		align-items: flex-start;
		gap: 4px;
		padding: 10px;
		border-left: 1px solid var(--border);
		opacity: 0;
		transition: opacity 0.15s;
	}

	.card-row:hover .card-actions { opacity: 1; }

	.icon-btn {
		padding: 5px 8px;
		font-size: 13px;
		color: var(--fg-4);
		border-color: transparent;
	}

	.icon-btn:hover {
		color: var(--accent);
		border-color: var(--accent);
		background: var(--accent-dim);
	}

	.danger-btn:hover {
		color: var(--danger) !important;
		border-color: var(--danger) !important;
		background: var(--danger-dim) !important;
	}

	.danger-btn.confirming {
		color: var(--danger);
		border-color: var(--danger);
		background: var(--danger-dim);
		opacity: 1;
	}

	/* ── Edit mode ───────────────────────────── */
	.card-edit {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr auto 1fr auto;
		gap: 10px;
		align-items: start;
		padding: 12px 14px;
	}

	@media (max-width: 600px) {
		.card-edit {
			grid-template-columns: 1fr;
		}
		.edit-arrow { display: none; }
	}

	.edit-arrow {
		color: var(--fg-4);
		padding-top: 12px;
		font-size: 12px;
	}

	.edit-actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 2px;
	}
</style>
