<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { LayoutData } from './$types';
  import { authStore } from '$lib/stores/auth';
  import { flashcardStore } from '$lib/stores/flashcards';

  export let data: LayoutData;

  let mounted = false;
  let signingOut = false;
  let accountError = '';

  $: if (mounted) {
    authStore.resolve(data.supabase, data.user ?? null, data.profile ?? null);
    if (data.user) void flashcardStore.initialize(data.supabase, data.user.id);
    else flashcardStore.reset();
  }

  $: displayName = data.profile?.displayName
    || data.user?.user_metadata?.full_name
    || data.user?.email
    || 'user';
  $: avatarUrl = data.profile?.avatarUrl || data.user?.user_metadata?.avatar_url || null;

  onMount(() => {
    mounted = true;
    authStore.resolve(data.supabase, data.user ?? null, data.profile ?? null);
    if (data.user) void flashcardStore.initialize(data.supabase, data.user.id);

    const { data: listener } = data.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') flashcardStore.reset();
      if (session?.expires_at !== data.session?.expires_at) void invalidate('supabase:auth');
    });

    return () => listener.subscription.unsubscribe();
  });

  async function signOut() {
    signingOut = true;
    accountError = '';
    try {
      await authStore.signOut();
    } catch (error) {
      accountError = error instanceof Error ? error.message : 'Sign-out failed. Please retry.';
    } finally {
      signingOut = false;
    }
  }
</script>

<div class="container">
  <header>
    <a href="/" class="wordmark" aria-label="Mindre home">
      <span class="prefix">~/</span><span class="name">mindre</span><span class="blink">▌</span>
    </a>
    <nav class="header-right" aria-label="Account">
      {#if data.user}
        <div class="user-section">
          {#if avatarUrl}
            <img src={avatarUrl} alt="" class="avatar" referrerpolicy="no-referrer" />
          {:else}
            <span class="avatar fallback">{displayName.slice(0, 1).toUpperCase()}</span>
          {/if}
          <span class="user-name" title={data.user.email ?? displayName}>{displayName}</span>
          <button class="signout" on:click={signOut} disabled={signingOut} aria-label="Sign out">
            {signingOut ? '…' : 'logout'}
          </button>
        </div>
      {:else}
        <span class="tagline">flashcard · spaced repetition</span>
      {/if}
    </nav>
  </header>

  {#if accountError}<div class="account-error" role="alert">error: {accountError}</div>{/if}

  <main><slot /></main>

  <footer>
    <span class="footer-hint"><kbd>←→</kbd> navigate&nbsp;&nbsp; <kbd>space</kbd> flip&nbsp;&nbsp; <kbd>esc</kbd> back</span>
    <span class="footer-version">v3.0</span>
  </footer>
</div>

<style>
  header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; margin-bottom: 40px; border-bottom: 1px solid var(--border-2); gap: 16px; }
  .wordmark { font-size: 18px; font-weight: 700; color: var(--fg); text-decoration: none; letter-spacing: -.01em; display: flex; align-items: center; }
  .prefix { color: var(--fg-3); font-weight: 300; }
  .name { color: var(--accent); margin: 0 1px; }
  .header-right, .user-section { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .tagline { font-size: 10px; color: var(--fg-4); letter-spacing: .1em; text-transform: uppercase; }
  .avatar { width: 26px; height: 26px; border-radius: var(--radius); border: 1px solid var(--border-3); object-fit: cover; }
  .avatar.fallback { display: grid; place-items: center; color: var(--accent); background: var(--bg-2); font-size: 10px; }
  .user-name { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: var(--fg-3); }
  .signout { font-size: 9px; padding: 4px 8px; }
  .account-error { margin: -24px 0 28px; padding: 8px 10px; border-left: 2px solid var(--danger); background: var(--danger-dim); color: var(--danger); font-size: 10px; }
  main { min-height: calc(100dvh - 180px); }
  footer { margin-top: 56px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .footer-hint { font-size: 10px; color: var(--fg-4); letter-spacing: .06em; text-transform: uppercase; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .footer-version { font-size: 10px; color: var(--fg-4); letter-spacing: .08em; }
  kbd { background: var(--bg-3); border: 1px solid var(--border-2); border-radius: 2px; padding: 1px 5px; font-family: var(--font); font-size: 10px; color: var(--fg-3); }
  @media (max-width: 560px) {
    .user-name { display: none; }
    footer { flex-direction: column; align-items: flex-start; gap: 6px; }
  }
</style>
