<script>
	import { onMount } from 'svelte';
	import { flashcardStore } from '$lib/stores.js';

	let decks = [];
	let showNewDeckForm = false;
	let newDeckName = '';
	let confirmDelete = null;
	let loading = true;
	let inputEl;

	flashcardStore.subscribe(data => {
		decks = data.decks;
	});

	onMount(async () => {
		loading = false;
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
			setTimeout(() => { confirmDelete = null; }, 3000);
		}
	}

	function openForm() {
		showNewDeckForm = true;
		setTimeout(() => inputEl?.focus(), 50);
	}

	function handleKey(e) {
		if (e.key === 'Enter' && newDeckName.trim()) createDeck();
		if (e.key === 'Escape') { showNewDeckForm = false; newDeckName = ''; }
	}
</script>

<svelte:window on:keydown={handleKey} />

<div class="home">
	<!-- Top bar -->
	<div class="topbar">
		<div class="stats">
			{#if !loading}
				<span class="stat">
					<span class="stat-val">{decks.length}</span>
					<span class="stat-label">deck{decks.length !== 1 ? 's' : ''}</span>
				</span>
				<span class="sep">/</span>
				<span class="stat">
					<span class="stat-val">{decks.reduce((a, d) => a + d.cards.length, 0)}</span>
					<span class="stat-label">cards</span>
				</span>
			{/if}
		</div>

		{#if !showNewDeckForm}
			<button class="primary" on:click={openForm}>+ new deck</button>
		{:else}
			<div class="inline-form">
				<input
					bind:this={inputEl}
					bind:value={newDeckName}
					placeholder="deck name..."
					maxlength="60"
				/>
				<button class="primary" on:click={createDeck} disabled={!newDeckName.trim()}>create</button>
				<button on:click={() => { showNewDeckForm = false; newDeckName = ''; }}>cancel</button>
			</div>
		{/if}
	</div>

	<!-- Content -->
	{#if loading}
		<div class="loading">
			<span class="dot-anim">loading<span class="blink">_</span></span>
		</div>
	{:else if decks.length === 0}
		<div class="empty">
			<div class="empty-icon">[ ]</div>
			<p>No decks yet.</p>
			<p class="empty-sub">Create a deck to start studying.</p>
		</div>
	{:else}
		<div class="deck-grid">
			{#each decks as deck (deck.id)}
				<div class="deck-card-wrap">
					<a href="/deck/{deck.id}" class="deck-card">
						<div class="deck-card-inner">
							<div class="deck-name">{deck.name}</div>
							<div class="deck-meta">
								<span class="deck-count">{deck.cards.length}</span>
								<span class="deck-count-label"> card{deck.cards.length !== 1 ? 's' : ''}</span>
							</div>
						</div>
						<div class="deck-arrow">→</div>
					</a>
					<button
						class="danger deck-delete"
						class:confirming={confirmDelete === deck.id}
						on:click|preventDefault={() => deleteDeck(deck.id)}
						title="Delete deck"
					>
						{confirmDelete === deck.id ? 'confirm?' : '×'}
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
		gap: 32px;
	}

	/* ── Topbar ──────────────────────────────── */
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
		color: var(--fg-3);
	}

	.stat { display: flex; align-items: baseline; gap: 5px; }
	.stat-val { font-size: 20px; font-weight: 700; color: var(--fg); }
	.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
	.sep { color: var(--border-2); }

	.inline-form {
		display: flex;
		gap: 8px;
		flex: 1;
		max-width: 480px;
		align-items: center;
	}

	.inline-form input {
		flex: 1;
	}

	/* ── Loading ─────────────────────────────── */
	.loading {
		padding: 60px 0;
		color: var(--fg-4);
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* ── Empty ───────────────────────────────── */
	.empty {
		padding: 80px 0;
		text-align: center;
		color: var(--fg-4);
	}

	.empty-icon {
		font-size: 32px;
		margin-bottom: 16px;
		color: var(--fg-4);
		letter-spacing: 6px;
	}

	.empty p { margin-bottom: 4px; }
	.empty-sub { font-size: 12px; color: var(--fg-4); }

	/* ── Deck Grid ───────────────────────────── */
	.deck-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
	}

	.deck-card-wrap {
		position: relative;
	}

	.deck-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-1);
		text-decoration: none;
		transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
		min-height: 90px;
	}

	.deck-card:hover {
		border-color: var(--accent);
		background: var(--bg-2);
		box-shadow: 0 0 24px var(--accent-dim);
		text-decoration: none;
	}

	.deck-card-inner { flex: 1; min-width: 0; }

	.deck-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--fg);
		margin-bottom: 8px;
		word-break: break-word;
		line-height: 1.4;
	}

	.deck-meta { display: flex; align-items: baseline; gap: 3px; }
	.deck-count { font-size: 18px; font-weight: 700; color: var(--accent); }
	.deck-count-label { font-size: 10px; color: var(--fg-4); text-transform: uppercase; letter-spacing: 0.06em; }

	.deck-arrow {
		color: var(--fg-4);
		font-size: 16px;
		margin-left: 12px;
		transition: color 0.15s, transform 0.15s;
	}

	.deck-card:hover .deck-arrow {
		color: var(--accent);
		transform: translateX(3px);
	}

	.deck-delete {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 3px 7px;
		font-size: 12px;
		opacity: 0;
		transition: opacity 0.15s;
		border-radius: var(--radius);
	}

	.deck-card-wrap:hover .deck-delete { opacity: 1; }
	.deck-delete.confirming {
		opacity: 1;
		border-color: var(--danger) !important;
		color: var(--danger) !important;
		background: var(--danger-dim) !important;
	}
</style>
