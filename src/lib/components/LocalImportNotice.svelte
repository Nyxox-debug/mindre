<script lang="ts">
  import { onMount } from 'svelte';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import type { Database } from '$lib/supabase/database.types';
  import { detectLocalImport, dismissLocalImport, importLocalData, type LocalImportCandidate } from '$lib/services/local-import';
  import { flashcardStore } from '$lib/stores/flashcards';

  export let userId: string;
  export let supabase: SupabaseClient<Database>;

  let candidate: LocalImportCandidate | null = null;
  let checking = true;
  let importing = false;
  let error = '';
  let complete = '';

  onMount(async () => {
    try {
      const detected = await detectLocalImport(userId);
      candidate = detected?.dismissed ? null : detected;
    } catch (value) {
      error = value instanceof Error ? value.message : 'Could not inspect local Mindre data.';
    } finally {
      checking = false;
    }
  });

  async function runImport() {
    if (!candidate) return;
    importing = true;
    error = '';
    try {
      const result = await importLocalData(supabase, candidate);
      await flashcardStore.refresh();
      complete = result.duplicate
        ? 'This local snapshot was already imported. The duplicate cache was cleared.'
        : `Imported ${result.deckCount} deck${result.deckCount === 1 ? '' : 's'} and ${result.cardCount} card${result.cardCount === 1 ? '' : 's'}.`;
      candidate = null;
    } catch (value) {
      error = value instanceof Error ? value.message : 'The import failed. Your local data was not removed.';
    } finally {
      importing = false;
    }
  }

  function dismiss() {
    if (!candidate) return;
    dismissLocalImport(userId, candidate.fingerprint);
    candidate = null;
  }
</script>

{#if !checking && (candidate || error || complete)}
  <section class="import-notice" aria-live="polite">
    {#if candidate}
      <div>
        <div class="notice-title"><span>$</span> local cache detected</div>
        <p>{candidate.deckCount} deck{candidate.deckCount === 1 ? '' : 's'} and {candidate.cardCount} card{candidate.cardCount === 1 ? '' : 's'} are still stored under <code>mindre-cache</code>.</p>
      </div>
      <div class="notice-actions">
        <button class="primary" on:click={runImport} disabled={importing || $flashcardStore.saving}>
          {importing ? 'importing…' : 'import to Supabase'}
        </button>
        <button on:click={dismiss} disabled={importing}>keep locally</button>
      </div>
    {/if}
    {#if error}<div class="notice-error" role="alert">error: {error}</div>{/if}
    {#if complete}<div class="notice-success">✓ {complete}</div>{/if}
  </section>
{/if}

<style>
  .import-notice { border: 1px solid var(--accent); background: var(--accent-dim); padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; border-radius: var(--radius); }
  .notice-title { color: var(--fg); font-size: 11px; letter-spacing: .07em; text-transform: uppercase; }
  .notice-title span { color: var(--accent); margin-right: 7px; }
  p { margin-top: 5px; color: var(--fg-3); font-size: 11px; }
  code { color: var(--accent-2); }
  .notice-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .notice-error { color: var(--danger); font-size: 11px; }
  .notice-success { color: var(--accent); font-size: 11px; }
</style>
