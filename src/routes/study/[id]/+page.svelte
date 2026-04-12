<script lang="ts">
  import { page } from '$app/stores';
  import { flashcardStore } from '$lib/stores';
  import { onMount } from 'svelte';
  import CodeBlock from '$lib/components/codeblock.svelte';
  import type { Deck, Card } from '$lib/types';

  let deck: Deck | null = null;
  let currentIndex = 0;
  let isFlipped = false;
  let shuffled = false;
  let cards: Card[] = [];
  let done = false;

  $: deckId = $page.params.id as string;
  $: currentCard = cards[currentIndex] ?? null;
  $: total = cards.length;
  $: progressPct = total > 0 ? (currentIndex / total) * 100 : 0;

  onMount(() => {
    const unsub = flashcardStore.subscribe(data => {
      deck = data.decks.find(d => d.id === deckId) ?? null;
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

  function flip() { isFlipped = !isFlipped; }

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

  function handleKey(e: KeyboardEvent) {
    if (done) {
      if (e.key === 'r' || e.key === 'R') reset();
      return;
    }
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); flip(); }
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'Escape') window.location.href = `/deck/${deckId}`;
  }

  $: frontIsCode = currentCard?.frontType === 'code';
  $: backIsCode = currentCard?.backType === 'code';
  $: cardLanguage = currentCard?.language ?? 'javascript';
</script>

<svelte:window on:keydown={handleKey} />

<div class="study-page">
  {#if !deck || deck.cards.length === 0}
    <div class="empty">
      <p class="prompt-msg"><span class="prompt">$</span> no cards to study</p>
      <a href="/deck/{deckId}">← back to deck</a>
    </div>

  {:else if done}
    <div class="done-screen">
      <div class="done-header">
        <span class="prompt">$</span>
        <span class="done-cmd">session complete</span>
      </div>
      <div class="done-check">✓</div>
      <p class="done-msg">You reviewed all <strong>{total}</strong> card{total !== 1 ? 's' : ''}.</p>
      <div class="done-actions">
        <button class="primary" on:click={reset}>↺ restart</button>
        <button on:click={shuffle}>⇄ shuffle</button>
        <a href="/deck/{deckId}" class="done-back">← back to deck</a>
      </div>
    </div>

  {:else}
    <!-- Progress -->
    <div class="progress-wrap">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progressPct}%"></div>
      </div>
      <span class="progress-label">{currentIndex + 1}/{total}</span>
    </div>

    <!-- Header -->
    <div class="study-header">
      <a href="/deck/{deckId}" class="exit">← exit</a>
      <div class="study-meta">
        <span class="deck-label">{deck.name}</span>
        {#if shuffled}
          <span class="shuffled-badge">⇄ shuffled</span>
        {/if}
      </div>
      <button class="shuffle-btn" on:click={shuffle}>
        {shuffled ? '✓ shuffled' : '⇄ shuffle'}
      </button>
    </div>

    <!-- Card scene -->
    <div
      class="card-scene"
      on:click={flip}
      on:keydown={e => e.key === 'Enter' && flip()}
      role="button"
      tabindex="0"
      aria-label="Flashcard — click or press space to flip"
    >
      <div class="card-3d" class:flipped={isFlipped}>
        <!-- Front -->
        <div class="card-face front" class:is-code={frontIsCode}>
          <span class="face-label">front {frontIsCode ? '· code' : ''}</span>
          <div class="card-body" class:code-body={frontIsCode}>
            {#if frontIsCode}
              <CodeBlock code={currentCard?.front ?? ''} language={cardLanguage} />
            {:else}
              <p class="card-text">{currentCard?.front}</p>
            {/if}
          </div>
          {#if !frontIsCode}
            <span class="flip-hint">space / click to reveal →</span>
          {/if}
        </div>

        <!-- Back -->
        <div class="card-face back" class:is-code={backIsCode}>
          <span class="face-label back-label">back {backIsCode ? '· code' : ''}</span>
          <div class="card-body" class:code-body={backIsCode}>
            {#if backIsCode}
              <CodeBlock code={currentCard?.back ?? ''} language={cardLanguage} />
            {:else}
              <p class="card-text">{currentCard?.back}</p>
            {/if}
          </div>
          {#if !backIsCode}
            <span class="flip-hint">← click to flip back</span>
          {/if}
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
    gap: 20px;
    min-height: calc(100dvh - 200px);
    justify-content: center;
  }

  /* ── Empty / done ─────────────────────────── */
  .empty {
    text-align: center;
    color: var(--fg-4);
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .prompt-msg { display: flex; gap: 8px; align-items: center; }
  .prompt { color: var(--accent); }

  .done-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }

  .done-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--fg-4);
  }
  .done-cmd { color: var(--fg-3); letter-spacing: 0.06em; }

  .done-check {
    font-size: 48px;
    color: var(--accent);
    animation: pop 0.4s ease;
    line-height: 1;
  }

  @keyframes pop {
    0% { transform: scale(0.4); opacity: 0; }
    70% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }

  .done-msg {
    font-size: 14px;
    color: var(--fg-3);
  }

  .done-msg strong { color: var(--fg); }

  .done-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 6px;
  }

  .done-back {
    font-size: 11px;
    color: var(--fg-4);
    letter-spacing: 0.06em;
  }

  /* ── Progress ─────────────────────────────── */
  .progress-wrap {
    width: 100%;
    max-width: 640px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-bar {
    flex: 1;
    height: 2px;
    background: var(--border-2);
    border-radius: 1px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 1px;
    transition: width 0.3s ease;
    box-shadow: 0 0 6px var(--accent-glow);
  }

  .progress-label {
    font-size: 11px;
    color: var(--fg-4);
    letter-spacing: 0.06em;
    flex-shrink: 0;
  }

  /* ── Header ──────────────────────────────── */
  .study-header {
    width: 100%;
    max-width: 640px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .exit {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-4);
    text-decoration: none;
    transition: color 0.12s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .exit:hover { color: var(--accent); }

  .study-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .deck-label {
    font-size: 11px;
    color: var(--fg-4);
    letter-spacing: 0.05em;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .shuffled-badge {
    font-size: 9px;
    color: var(--accent);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .shuffle-btn {
    font-size: 9px;
    padding: 4px 9px;
    flex-shrink: 0;
  }

  /* ── 3D Card ─────────────────────────────── */
  .card-scene {
    perspective: 1400px;
    width: 100%;
    max-width: 640px;
    height: 340px;
    cursor: pointer;
    outline: none;
    flex-shrink: 0;
  }

  .card-scene:focus-visible .card-3d {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  .card-3d {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
    padding: 32px;
    border-radius: var(--radius);
    background: var(--bg-1);
    border: 1px solid var(--border-2);
    gap: 12px;
    overflow: hidden;
  }

  .card-face.front {
    border-color: var(--accent);
    box-shadow: inset 0 0 40px rgba(0, 230, 118, 0.04);
  }

  .card-face.back {
    transform: rotateY(180deg);
    background: var(--bg-2);
    border-color: var(--border-3);
  }

  .card-face.is-code {
    padding: 24px;
    justify-content: flex-start;
    overflow-y: auto;
  }

  .face-label {
    position: absolute;
    top: 12px;
    left: 16px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    opacity: 0.7;
  }

  .back-label { color: var(--fg-4); }

  .card-body {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .card-body.code-body {
    align-items: flex-start;
    justify-content: stretch;
    margin-top: 20px;
    overflow: auto;
  }

  :global(.card-body.code-body .code-block) {
    width: 100%;
    max-height: 260px;
    overflow-y: auto;
  }

  .card-text {
    font-size: 17px;
    line-height: 1.55;
    text-align: center;
    word-break: break-word;
    color: var(--fg);
    max-width: 520px;
  }

  .flip-hint {
    position: absolute;
    bottom: 12px;
    font-size: 9px;
    letter-spacing: 0.09em;
    color: var(--fg-4);
    text-transform: uppercase;
  }

  /* ── Controls ────────────────────────────── */
  .controls {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 640px;
  }

  .controls button { min-width: 90px; }

  .dots {
    flex: 1;
    display: flex;
    gap: 4px;
    justify-content: center;
    flex-wrap: wrap;
    max-height: 28px;
    overflow: hidden;
  }

  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--border-3);
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .dot.active {
    background: var(--accent);
    box-shadow: 0 0 5px var(--accent-glow);
  }

  .dot.past { background: var(--fg-4); }

  /* ── Keyboard hints ──────────────────────── */
  .kbd-hints {
    display: flex;
    gap: 14px;
    font-size: 10px;
    color: var(--fg-4);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    align-items: center;
  }

  kbd {
    background: var(--bg-3);
    border: 1px solid var(--border-2);
    border-radius: 2px;
    padding: 1px 5px;
    font-family: var(--font);
    font-size: 10px;
    color: var(--fg-3);
  }

  @media (max-width: 600px) {
    .card-scene { height: 280px; }
    .card-text { font-size: 14px; }
    .card-face { padding: 24px 20px; }
    .kbd-hints { display: none; }
    .deck-label { display: none; }
  }
</style>
