<script lang="ts">
  import { onMount } from 'svelte';
  import LocalImportNotice from '$lib/components/LocalImportNotice.svelte';
  import type { PageData } from './$types';
  import { flashcardStore } from '$lib/stores/flashcards';
  import { isCardDue } from '$lib/spaced-repetition';

  export let data: PageData;

  let showNewDeckForm = false;
  let newDeckName = '';
  let confirmDelete: string | null = null;
  let renameDeckId: string | null = null;
  let renameValue = '';
  let inputEl: HTMLInputElement;

  $: decks = $flashcardStore.decks;
  $: loading = $flashcardStore.loading;
  $: totalCards = decks.reduce((total, deck) => total + deck.cards.length, 0);
  $: codeCards = decks.reduce(
    (total, deck) => total + deck.cards.filter((card) => card.frontType === 'code' || card.backType === 'code').length,
    0
  );
  $: dueCards = decks.reduce(
    (total, deck) => total + deck.cards.filter((card) => isCardDue(card.progress)).length,
    0
  );

  onMount(() => {
    if (data.user && !$flashcardStore.initialized) {
      void flashcardStore.initialize(data.supabase, data.user.id);
    }
  });

  async function createDeck() {
    const name = newDeckName.trim();
    if (!name) return;
    try {
      await flashcardStore.addDeck(name);
      newDeckName = '';
      showNewDeckForm = false;
    } catch { /* store displays the error */ }
  }

  async function deleteDeck(id: string) {
    if (confirmDelete !== id) {
      confirmDelete = id;
      setTimeout(() => { if (confirmDelete === id) confirmDelete = null; }, 3000);
      return;
    }
    try {
      await flashcardStore.deleteDeck(id);
      confirmDelete = null;
    } catch { /* store displays the error */ }
  }

  function beginRename(id: string, name: string) {
    renameDeckId = id;
    renameValue = name;
  }

  async function saveRename() {
    const name = renameValue.trim();
    if (!renameDeckId || !name) return;
    try {
      await flashcardStore.renameDeck(renameDeckId, name);
      renameDeckId = null;
      renameValue = '';
    } catch { /* store displays the error */ }
  }

  function openForm() {
    showNewDeckForm = true;
    setTimeout(() => inputEl?.focus(), 50);
  }

  function handleKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
    if (event.key === 'Enter' && !typing && showNewDeckForm && newDeckName.trim()) void createDeck();
    if (event.key === 'Escape') {
      showNewDeckForm = false;
      newDeckName = '';
      renameDeckId = null;
      confirmDelete = null;
    }
  }
</script>

<svelte:head><title>decks · mindre</title></svelte:head>
<svelte:window on:keydown={handleKey} />

<div class="home">
  <div class="shell-line">
    <span class="prompt">$</span><span class="cmd">list decks</span><span class="blink">▌</span>
  </div>

  {#if data.user}
    <LocalImportNotice userId={data.user.id} supabase={data.supabase} />
  {/if}

  {#if $flashcardStore.error}
    <div class="notice error" role="alert"><span>error: {$flashcardStore.error}</span><button on:click={flashcardStore.clearMessages}>×</button></div>
  {:else if $flashcardStore.success}
    <div class="notice success"><span>✓ {$flashcardStore.success}</span><button on:click={flashcardStore.clearMessages}>×</button></div>
  {/if}

  {#if !loading && decks.length > 0}
    <div class="stats-bar">
      <div class="stat"><span class="stat-val">{decks.length}</span><span class="stat-label">deck{decks.length !== 1 ? 's' : ''}</span></div>
      <span class="stat-sep">/</span>
      <div class="stat"><span class="stat-val">{totalCards}</span><span class="stat-label">total cards</span></div>
      {#if dueCards > 0}<span class="stat-sep">/</span><div class="stat"><span class="stat-val">{dueCards}</span><span class="stat-label">due</span></div>{/if}
      {#if codeCards > 0}<span class="stat-sep">/</span><div class="stat"><span class="stat-val code-accent">{codeCards}</span><span class="stat-label">code</span></div>{/if}
      <div class="topbar-actions">
        {#if !showNewDeckForm}
          <button class="primary" on:click={openForm}>+ new deck</button>
        {:else}
          <div class="inline-form">
            <span class="inline-prompt">&gt;</span>
            <input bind:this={inputEl} bind:value={newDeckName} placeholder="deck name..." maxlength="60" aria-label="Deck name" />
            <button class="primary" on:click={createDeck} disabled={!newDeckName.trim() || $flashcardStore.saving}>create</button>
            <button on:click={() => { showNewDeckForm = false; newDeckName = ''; }}>cancel</button>
          </div>
        {/if}
      </div>
    </div>
  {:else if !loading}
    <div class="topbar-alone">
      {#if !showNewDeckForm}<button class="primary" on:click={openForm}>+ new deck</button>
      {:else}
        <div class="inline-form">
          <span class="inline-prompt">&gt;</span>
          <input bind:this={inputEl} bind:value={newDeckName} placeholder="deck name..." maxlength="60" aria-label="Deck name" />
          <button class="primary" on:click={createDeck} disabled={!newDeckName.trim() || $flashcardStore.saving}>create</button>
          <button on:click={() => { showNewDeckForm = false; newDeckName = ''; }}>cancel</button>
        </div>
      {/if}
    </div>
  {/if}

  {#if loading}
    <div class="loading"><span class="loading-text">loading from Supabase<span class="blink">▌</span></span></div>
  {:else if decks.length === 0}
    <div class="empty">
      <div class="empty-art"><div class="empty-line">┌─────────────────────┐</div><div class="empty-line">│  no decks found     │</div><div class="empty-line">└─────────────────────┘</div></div>
      <p class="empty-sub">Create a deck to start studying.</p>
      {#if !showNewDeckForm}<button class="primary" on:click={openForm}>+ create first deck</button>{/if}
    </div>
  {:else}
    <div class="deck-grid">
      {#each decks as deck (deck.id)}
        {@const hasCode = deck.cards.some((card) => card.frontType === 'code' || card.backType === 'code')}
        {@const deckDue = deck.cards.filter((card) => isCardDue(card.progress)).length}
        <div class="deck-card-wrap">
          {#if renameDeckId === deck.id}
            <div class="rename-form">
              <input bind:value={renameValue} maxlength="60" aria-label="New deck name" on:keydown={(event) => { if (event.key === 'Enter') void saveRename(); }} />
              <button class="primary" on:click={saveRename} disabled={!renameValue.trim() || $flashcardStore.saving}>save</button>
              <button on:click={() => (renameDeckId = null)}>cancel</button>
            </div>
          {:else}
            <a href="/deck/{deck.id}" class="deck-card">
              <div class="deck-card-top"><div class="deck-name">{deck.name}</div>{#if hasCode}<span class="code-badge">&#x3C;/&#x3E;</span>{/if}</div>
              <div class="deck-card-bottom">
                <div class="deck-meta"><span class="deck-count">{deck.cards.length}</span><span class="deck-count-label"> card{deck.cards.length !== 1 ? 's' : ''}</span></div>
                {#if deckDue > 0}<span class="due-count">{deckDue} due</span>{/if}
                {#if hasCode}<span class="deck-code-count">{deck.cards.filter((card) => card.frontType === 'code' || card.backType === 'code').length} code</span>{/if}
                <span class="deck-arrow">→</span>
              </div>
            </a>
            <div class="deck-actions">
              <button on:click={() => beginRename(deck.id, deck.name)} title="Rename deck" aria-label="Rename {deck.name}">✎</button>
              <button class="danger deck-delete" class:confirming={confirmDelete === deck.id} on:click={() => deleteDeck(deck.id)} title="Delete deck" aria-label="Delete {deck.name}" disabled={$flashcardStore.saving}>
                {confirmDelete === deck.id ? 'confirm?' : '×'}
              </button>
            </div>
          {/if}
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

  .notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; border: 1px solid var(--border-2); background: var(--bg-1); font-size: 11px; }
  .notice.error { color: var(--danger); border-color: var(--danger); background: var(--danger-dim); }
  .notice.success { color: var(--accent); }
  .notice button { padding: 2px 6px; font-size: 9px; }
  .deck-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 3px; opacity: 0; transition: opacity .12s; z-index: 2; }
  .deck-card-wrap:hover .deck-actions, .deck-card-wrap:focus-within .deck-actions { opacity: 1; }
  .deck-actions button { padding: 2px 6px; font-size: 10px; }
  .deck-delete { position: static; opacity: 1; }
  .rename-form { display: flex; gap: 6px; padding: 8px; border: 1px solid var(--border-2); background: var(--bg-1); }
  .rename-form input { min-width: 0; }
  .due-count { font-size: 9px; color: var(--accent); text-transform: uppercase; letter-spacing: .07em; }
  @media (max-width: 600px) { .deck-actions { opacity: 1; } .inline-form { flex-wrap: wrap; } }
</style>
