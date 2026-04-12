<script lang="ts">
  import { page } from "$app/stores";
  import { flashcardStore } from "$lib/stores";
  import { onMount } from "svelte";
  import CodeBlock from "$lib/components/codeblock.svelte";
  import type { Deck, Card, CardType } from "$lib/types";

  let deck: Deck | null = null;
  let showAddForm = false;
  let confirmDeleteCard: string | null = null;
  let editingCard: string | null = null;

  // Add form state
  let cardFront = "";
  let cardBack = "";
  let frontType: CardType = "text";
  let backType: CardType = "code";
  let cardLanguage = "javascript";
  let frontInput: HTMLTextAreaElement;

  // Edit form state
  let editFront = "";
  let editBack = "";
  let editFrontType: CardType = "text";
  let editBackType: CardType = "code";
  let editLanguage = "javascript";

  $: deckId = $page.params.id as string;

  const LANGUAGES = [
    "javascript",
    "typescript",
    "python",
    "rust",
    "go",
    "java",
    "c",
    "cpp",
    "csharp",
    "bash",
    "sql",
    "html",
    "css",
    "json",
    "yaml",
    "markdown",
    "ruby",
    "php",
    "swift",
    "kotlin",
  ];

  onMount(() => {
    const unsub = flashcardStore.subscribe((data) => {
      deck = data.decks.find((d) => d.id === deckId) ?? null;
    });
    return unsub;
  });

  function addCard() {
    if (cardFront.trim() && cardBack.trim()) {
      flashcardStore.addCard(
        deckId,
        cardFront.trim(),
        cardBack.trim(),
        frontType,
        backType,
        cardLanguage,
      );
      cardFront = "";
      cardBack = "";
      frontType = "text";
      backType = "code";
      showAddForm = false;
    }
  }

  function deleteCard(cardId: string) {
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

  function startEdit(card: Card) {
    editingCard = card.id;
    editFront = card.front;
    editBack = card.back;
    editFrontType = card.frontType ?? "text";
    editBackType = card.backType ?? "text";
    editLanguage = card.language ?? "javascript";
  }

  function saveEdit(cardId: string) {
    if (editFront.trim() && editBack.trim()) {
      flashcardStore.updateCard(
        deckId,
        cardId,
        editFront.trim(),
        editBack.trim(),
        editFrontType,
        editBackType,
        editLanguage,
      );
    }
    editingCard = null;
  }

  function openForm() {
    showAddForm = true;
    setTimeout(() => frontInput?.focus(), 50);
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      showAddForm = false;
      cardFront = "";
      cardBack = "";
      editingCard = null;
      confirmDeleteCard = null;
    }
  }
</script>

<svelte:window on:keydown={handleKey} />

<div class="deck-page">
  {#if !deck}
    <div class="not-found">
      <span class="prompt">$</span> deck not found — <a href="/">go home</a>
    </div>
  {:else}
    <!-- Header -->
    <div class="deck-header">
      <a href="/" class="back">← decks</a>
      <div class="header-main">
        <div class="shell-title">
          <span class="prompt">$</span>
          <span class="deck-path">decks/</span>
          <h2 class="deck-title">{deck.name}</h2>
        </div>
        <div class="deck-badges">
          <span class="badge"
            >{deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""}</span
          >
          {#if deck.cards.some((c) => c.frontType === "code" || c.backType === "code")}
            <span class="badge code">&#x3C;/&#x3E; code</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Actions row -->
    <div class="actions-row">
      {#if deck.cards.length > 0}
        <a href="/study/{deckId}" class="study-link">▶ study</a>
      {/if}
      <button class="primary" on:click={openForm}>+ add card</button>
    </div>

    <!-- Add card form -->
    {#if showAddForm}
      <div class="add-form">
        <div class="form-header">
          <span class="form-label">$ add card</span>
          <div class="lang-select-wrap">
            <label class="field-label" for="add-lang">language</label>
            <select id="add-lang" bind:value={cardLanguage}>
              {#each LANGUAGES as lang}
                <option value={lang}>{lang}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <!-- Front -->
          <div class="form-field">
            <div class="field-header">
              <label class="field-label" for="front-textarea">front</label>
              <div class="type-toggle">
                <button
                  class:active={frontType === "text"}
                  on:click={() => (frontType = "text")}>text</button
                >
                <button
                  class:active={frontType === "code"}
                  on:click={() => (frontType = "code")}>&#x3C;/&#x3E;</button
                >
              </div>
            </div>
            <textarea
              id="front-textarea"
              bind:this={frontInput}
              bind:value={cardFront}
              class:code-input={frontType === "code"}
              placeholder={frontType === "code"
                ? "// paste your code here..."
                : "Question or term..."}
              rows="5"
            ></textarea>
          </div>

          <div class="form-arrow">→</div>

          <!-- Back -->
          <div class="form-field">
            <div class="field-header">
              <label class="field-label" for="back-textarea">back</label>
              <div class="type-toggle">
                <button
                  class:active={backType === "text"}
                  on:click={() => (backType = "text")}>text</button
                >
                <button
                  class:active={backType === "code"}
                  on:click={() => (backType = "code")}>&#x3C;/&#x3E;</button
                >
              </div>
            </div>
            <textarea
              id="back-textarea"
              bind:value={cardBack}
              class:code-input={backType === "code"}
              placeholder={backType === "code"
                ? "// answer code here..."
                : "Answer or definition..."}
              rows="5"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button
            class="primary"
            on:click={addCard}
            disabled={!cardFront.trim() || !cardBack.trim()}
          >
            add card
          </button>
          <button
            on:click={() => {
              showAddForm = false;
              cardFront = "";
              cardBack = "";
            }}>cancel</button
          >
        </div>
      </div>
    {/if}

    <!-- Card list -->
    {#if deck.cards.length === 0 && !showAddForm}
      <div class="empty">
        <div class="empty-art">[ empty ]</div>
        <p>No cards yet. Add your first card above.</p>
        <p class="empty-tip">
          Tip: enable the "code" type to add syntax-highlighted code snippets.
        </p>
      </div>
    {:else}
      <div class="card-list">
        {#each deck.cards as card, i (card.id)}
          {@const isCode =
            card.frontType === "code" || card.backType === "code"}
          <div
            class="card-row"
            class:editing={editingCard === card.id}
            class:is-code={isCode}
          >
            <div class="card-num">
              {String(i + 1).padStart(2, "0")}
              {#if isCode}<span class="num-code">&#x3C;/&#x3E;</span>{/if}
            </div>

            {#if editingCard === card.id}
              <!-- Edit mode -->
              <div class="card-edit">
                <div class="edit-col">
                  <div class="field-header">
                    <span class="field-label">front</span>
                    <div class="type-toggle small">
                      <button
                        class:active={editFrontType === "text"}
                        on:click={() => (editFrontType = "text")}>txt</button
                      >
                      <button
                        class:active={editFrontType === "code"}
                        on:click={() => (editFrontType = "code")}
                        >&#x3C;/&#x3E;</button
                      >
                    </div>
                  </div>
                  <textarea
                    bind:value={editFront}
                    class:code-input={editFrontType === "code"}
                    rows="3"
                  ></textarea>
                </div>
                <div class="edit-arrow">→</div>
                <div class="edit-col">
                  <div class="field-header">
                    <span class="field-label">back</span>
                    <div class="type-toggle small">
                      <button
                        class:active={editBackType === "text"}
                        on:click={() => (editBackType = "text")}>txt</button
                      >
                      <button
                        class:active={editBackType === "code"}
                        on:click={() => (editBackType = "code")}
                        >&#x3C;/&#x3E;</button
                      >
                    </div>
                  </div>
                  <textarea
                    bind:value={editBack}
                    class:code-input={editBackType === "code"}
                    rows="3"
                  ></textarea>
                </div>
                <div class="edit-sidebar">
                  <div class="field-header">
                    <span class="field-label">lang</span>
                  </div>
                  <select
                    bind:value={editLanguage}
                    style="padding: 7px 10px; font-size: 11px;"
                  >
                    {#each LANGUAGES as lang}
                      <option value={lang}>{lang}</option>
                    {/each}
                  </select>
                  <div class="edit-actions">
                    <button class="primary" on:click={() => saveEdit(card.id)}
                      >save</button
                    >
                    <button on:click={() => (editingCard = null)}>cancel</button
                    >
                  </div>
                </div>
              </div>
            {:else}
              <!-- View mode -->
              <div class="card-content">
                <div class="card-side">
                  <span class="side-label">F</span>
                  <div class="side-body">
                    {#if card.frontType === "code"}
                      <CodeBlock
                        code={card.front}
                        language={card.language ?? "javascript"}
                      />
                    {:else}
                      <span class="side-text">{card.front}</span>
                    {/if}
                  </div>
                </div>
                <div class="card-sep">→</div>
                <div class="card-side back">
                  <span class="side-label">B</span>
                  <div class="side-body">
                    {#if card.backType === "code"}
                      <CodeBlock
                        code={card.back}
                        language={card.language ?? "javascript"}
                      />
                    {:else}
                      <span class="side-text">{card.back}</span>
                    {/if}
                  </div>
                </div>
              </div>
              <div class="card-actions">
                <button
                  class="icon-btn"
                  on:click={() => startEdit(card)}
                  title="Edit">✎</button
                >
                <button
                  class="icon-btn danger-btn"
                  class:confirming={confirmDeleteCard === card.id}
                  on:click={() => deleteCard(card.id)}
                  title="Delete"
                  >{confirmDeleteCard === card.id ? "?" : "×"}</button
                >
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
    gap: 24px;
  }

  .not-found {
    color: var(--fg-3);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .prompt {
    color: var(--accent);
  }

  /* ── Header ──────────────────────────────── */
  .deck-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .back {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-4);
    text-decoration: none;
    transition: color 0.12s;
  }
  .back:hover {
    color: var(--accent);
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .shell-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .deck-path {
    font-size: 16px;
    color: var(--fg-4);
    font-weight: 300;
  }

  .deck-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--fg);
    letter-spacing: -0.01em;
  }

  .deck-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--accent);
    border: 1px solid currentColor;
    padding: 2px 7px;
    border-radius: var(--radius);
    opacity: 0.8;
  }

  .badge.code {
    color: var(--accent-2);
  }

  /* ── Actions ─────────────────────────────── */
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
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--bg);
    background: var(--accent);
    border: 1px solid var(--accent);
    padding: 7px 14px;
    border-radius: var(--radius);
    text-decoration: none;
    transition:
      box-shadow 0.12s,
      opacity 0.12s;
  }
  .study-link:hover {
    box-shadow: 0 0 18px var(--accent-glow);
    opacity: 0.9;
    text-decoration: none;
  }

  /* ── Add form ────────────────────────────── */
  .add-form {
    border: 1px solid var(--border-3);
    border-radius: var(--radius);
    padding: 20px;
    background: var(--bg-1);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .form-label {
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.08em;
  }

  .lang-select-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--fg-4);
    flex-shrink: 0;
  }

  .lang-select-wrap select {
    width: 130px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 14px;
    align-items: start;
  }

  .form-arrow {
    color: var(--fg-4);
    padding-top: 30px;
    font-size: 13px;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .form-arrow {
      display: none;
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  /* type toggle */
  .type-toggle {
    display: flex;
    border: 1px solid var(--border-3);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .type-toggle button {
    padding: 3px 9px;
    font-size: 10px;
    border: none;
    border-radius: 0;
    color: var(--fg-4);
    background: transparent;
  }

  .type-toggle button:hover {
    background: var(--bg-3);
    color: var(--fg-2);
    border: none;
    box-shadow: none;
  }

  .type-toggle button.active {
    background: var(--accent-dim);
    color: var(--accent);
  }

  .type-toggle button + button {
    border-left: 1px solid var(--border-3);
  }

  .type-toggle.small button {
    padding: 2px 7px;
    font-size: 9px;
  }

  :global(.code-input) {
    font-family: var(--font) !important;
    background: var(--bg-code) !important;
    border-color: var(--accent-2) !important;
    color: #abb2bf !important;
    font-size: 12px !important;
    tab-size: 2;
  }

  .form-actions {
    display: flex;
    gap: 8px;
  }

  /* ── Empty ───────────────────────────────── */
  .empty {
    padding: 48px 0;
    color: var(--fg-4);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .empty-art {
    font-size: 16px;
    letter-spacing: 4px;
    color: var(--fg-4);
  }

  .empty-tip {
    font-size: 11px;
    color: var(--fg-4);
    border-left: 2px solid var(--border-3);
    padding-left: 10px;
    margin-top: 6px;
    max-width: 480px;
    line-height: 1.6;
  }

  /* ── Card list ───────────────────────────── */
  .card-list {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .card-row {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--border);
    background: var(--bg-1);
    transition: background 0.12s;
    min-height: 56px;
    position: relative;
  }

  .card-row:last-child {
    border-bottom: none;
  }
  .card-row:hover {
    background: var(--bg-2);
  }
  .card-row.editing {
    background: var(--bg-2);
  }
  .card-row.is-code {
    border-left: 2px solid rgba(0, 188, 212, 0.3);
  }

  .card-num {
    font-size: 10px;
    color: var(--fg-4);
    padding: 14px 12px;
    border-right: 1px solid var(--border);
    min-width: 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    letter-spacing: 0.04em;
  }

  .num-code {
    font-size: 8px;
    color: var(--accent-2);
    opacity: 0.7;
  }

  .card-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    min-width: 0;
  }

  @media (max-width: 600px) {
    .card-content {
      grid-template-columns: 1fr;
    }
    .card-sep {
      display: none;
    }
  }

  .card-side {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    min-width: 0;
  }

  .card-side.back {
    border-left: 1px solid var(--border);
  }

  .side-label {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--fg-4);
    padding-top: 3px;
    flex-shrink: 0;
  }

  .side-body {
    flex: 1;
    min-width: 0;
  }

  .side-text {
    font-size: 12px;
    color: var(--fg-2);
    word-break: break-word;
    line-height: 1.55;
  }

  .card-sep {
    color: var(--fg-4);
    padding: 14px 8px;
    font-size: 11px;
    display: flex;
    align-items: flex-start;
    padding-top: 15px;
  }

  .card-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    border-left: 1px solid var(--border);
    opacity: 0;
    transition: opacity 0.12s;
    flex-shrink: 0;
  }

  .card-row:hover .card-actions {
    opacity: 1;
  }

  @media (max-width: 600px) {
    .card-actions {
      opacity: 1;
    }
  }

  .icon-btn {
    padding: 4px 7px;
    font-size: 12px;
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
    min-width: 0;
  }

  @media (max-width: 640px) {
    .card-edit {
      grid-template-columns: 1fr;
    }
    .edit-arrow {
      display: none;
    }
  }

  .edit-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .edit-arrow {
    color: var(--fg-4);
    padding-top: 30px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .edit-sidebar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 110px;
  }

  .edit-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 4px;
  }
</style>
