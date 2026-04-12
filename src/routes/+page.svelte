<script lang="ts">
  import { onMount } from 'svelte';
  import { flashcardStore } from '$lib/stores';
  import type { Deck } from '$lib/types';

  let decks: Deck[] = [];
  let showNewDeckForm = false;
  let newDeckName = '';
  let confirmDelete: string | null = null;
  let loading = true;
  let inputEl: HTMLInputElement;

  flashcardStore.subscribe(data => {
    decks = data.decks;
  });

  onMount(() => {
    loading = false;
  });

  function createDeck() {
    if (newDeckName.trim()) {
      flashcardStore.addDeck(newDeckName.trim());
      newDeckName = '';
      showNewDeckForm = false;
    }
  }

  function deleteDeck(id: string) {
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

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && newDeckName.trim()) createDeck();
    if (e.key === 'Escape') { showNewDeckForm = false; newDeckName = ''; }
  }

  $: totalCards = decks.reduce((a, d) => a + d.cards.length, 0);
  $: codeCards = decks.reduce(
    (a, d) => a + d.cards.filter(c => c.frontType === 'code' || c.backType === 'code').length,
    0
  );
</script>

<svelte:window on:keydown={handleKey} />

<div class="home">
  <!-- Shell prompt header -->
  <div class="shell-line">
    <span class="prompt">$</span>
    <span class="cmd">list decks</span>
    <span class="blink">▌</span>
  </div>

  <!-- Stats bar -->
  {#if !loading && decks.length > 0}
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-val">{decks.length}</span>
        <span class="stat-label">deck{decks.length !== 1 ? 's' : ''}</span>
      </div>
      <span class="stat-sep">/</span>
      <div class="stat">
        <span class="stat-val">{totalCards}</span>
        <span class="stat-label">total cards</span>
      </div>
      {#if codeCards > 0}
        <span class="stat-sep">/</span>
        <div class="stat">
          <span class="stat-val code-accent">{codeCards}</span>
          <span class="stat-label">code</span>
        </div>
      {/if}
      <div class="topbar-actions">
        {#if !showNewDeckForm}
          <button class="primary" on:click={openForm}>+ new deck</button>
        {:else}
          <div class="inline-form">
            <span class="inline-prompt">&gt;</span>
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
    </div>
  {:else if !loading}
    <div class="topbar-alone">
      {#if !showNewDeckForm}
        <button class="primary" on:click={openForm}>+ new deck</button>
      {:else}
        <div class="inline-form">
          <span class="inline-prompt">&gt;</span>
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
  {/if}

  <!-- Content -->
  {#if loading}
    <div class="loading">
      <span class="loading-text">loading<span class="blink">▌</span></span>
    </div>
  {:else if decks.length === 0}
    <div class="empty">
      <div class="empty-art">
        <div class="empty-line">┌─────────────────────┐</div>
        <div class="empty-line">│  no decks found     │</div>
        <div class="empty-line">└─────────────────────┘</div>
      </div>
      <p class="empty-sub">Create a deck to start studying.</p>
      {#if !showNewDeckForm}
        <button class="primary" on:click={openForm}>+ create first deck</button>
      {/if}
    </div>
  {:else}
    <div class="deck-grid">
      {#each decks as deck (deck.id)}
        {@const hasCode = deck.cards.some(c => c.frontType === 'code' || c.backType === 'code')}
        <div class="deck-card-wrap">
          <a href="/deck/{deck.id}" class="deck-card">
            <div class="deck-card-top">
              <div class="deck-name">{deck.name}</div>
              {#if hasCode}
                <span class="code-badge">&#x3C;/&#x3E;</span>
              {/if}
            </div>
            <div class="deck-card-bottom">
              <div class="deck-meta">
                <span class="deck-count">{deck.cards.length}</span>
                <span class="deck-count-label"> card{deck.cards.length !== 1 ? 's' : ''}</span>
              </div>
              {#if hasCode}
                <span class="deck-code-count">
                  {deck.cards.filter(c => c.frontType === 'code' || c.backType === 'code').length} code
                </span>
              {/if}
              <span class="deck-arrow">→</span>
            </div>
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
    gap: 24px;
  }

  /* ── Shell line ──────────────────────────── */
  .shell-line {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--fg-4);
  }

  .prompt { color: var(--accent); }
  .cmd { color: var(--fg-3); }

  /* ── Stats bar ───────────────────────────── */
  .stats-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .stat-val {
    font-size: 22px;
    font-weight: 700;
    color: var(--fg);
    line-height: 1;
  }

  .stat-val.code-accent { color: var(--accent-2); }

  .stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--fg-4);
  }

  .stat-sep { color: var(--border-3); font-size: 12px; }

  .topbar-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .topbar-alone { display: flex; gap: 8px; align-items: center; }

  .inline-form {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    max-width: 480px;
  }

  .inline-form input { flex: 1; }

  .inline-prompt {
    color: var(--accent);
    font-size: 13px;
    flex-shrink: 0;
  }

  /* ── Loading ─────────────────────────────── */
  .loading {
    padding: 60px 0;
    color: var(--fg-4);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .loading-text { display: flex; align-items: center; gap: 2px; }

  /* ── Empty ───────────────────────────────── */
  .empty {
    padding: 60px 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .empty-art {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .empty-line {
    font-size: 13px;
    color: var(--fg-4);
    letter-spacing: 0.04em;
    line-height: 1.6;
  }

  .empty-sub {
    font-size: 12px;
    color: var(--fg-4);
    letter-spacing: 0.04em;
  }

  /* ── Deck grid ───────────────────────────── */
  .deck-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }

  .deck-card-wrap {
    position: relative;
  }

  .deck-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px 20px;
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--bg-1);
    text-decoration: none;
    transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;
    min-height: 96px;
    gap: 10px;
  }

  .deck-card:hover {
    border-color: var(--accent);
    background: var(--bg-2);
    box-shadow: 0 0 20px var(--accent-dim), inset 0 0 0 1px var(--accent-dim);
    text-decoration: none;
  }

  .deck-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .deck-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--fg);
    word-break: break-word;
    line-height: 1.4;
    flex: 1;
  }

  .code-badge {
    font-size: 10px;
    color: var(--accent-2);
    border: 1px solid var(--accent-2);
    padding: 1px 6px;
    border-radius: var(--radius);
    opacity: 0.7;
    flex-shrink: 0;
    letter-spacing: 0.04em;
  }

  .deck-card-bottom {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .deck-meta { display: flex; align-items: baseline; gap: 3px; }
  .deck-count { font-size: 20px; font-weight: 700; color: var(--accent); }
  .deck-count-label {
    font-size: 9px;
    color: var(--fg-4);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .deck-code-count {
    font-size: 9px;
    color: var(--accent-2);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    opacity: 0.7;
  }

  .deck-arrow {
    color: var(--fg-4);
    font-size: 14px;
    margin-left: auto;
    transition: color 0.12s, transform 0.12s;
  }

  .deck-card:hover .deck-arrow {
    color: var(--accent);
    transform: translateX(3px);
  }

  .deck-delete {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 6px;
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.12s;
  }

  .deck-card-wrap:hover .deck-delete { opacity: 1; }
  .deck-delete.confirming {
    opacity: 1;
    border-color: var(--danger) !important;
    color: var(--danger) !important;
    background: var(--danger-dim) !important;
  }

  @media (max-width: 480px) {
    .deck-grid { grid-template-columns: 1fr; }
  }
</style>
