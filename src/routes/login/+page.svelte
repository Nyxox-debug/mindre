<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import type { PageData } from './$types';

  export let data: PageData;

  let working = false;
  let localError = '';

  $: friendlyError = localError || formatError(data.authError);

  function formatError(value: string | null | undefined): string {
    if (!value) return '';
    if (value === 'missing_oauth_code') return 'Google did not return a usable authorization code.';
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  async function login() {
    working = true;
    localError = '';
    try {
      await authStore.signInWithGoogle(data.next);
    } catch (error) {
      localError = error instanceof Error ? error.message : 'Google sign-in could not be started.';
      working = false;
    }
  }
</script>

<svelte:head><title>login · mindre</title></svelte:head>

<div class="login-page">
  <section class="login-panel" aria-labelledby="login-title">
    <div class="terminal-line"><span class="prompt">$</span> auth login --provider google</div>
    <h1 id="login-title">Sign in to Mindre</h1>
    <p>Sync your developer flashcards, attachments, and review schedule securely across devices.</p>

    {#if friendlyError}
      <div class="auth-error" role="alert">
        <span>error:</span> {friendlyError}
      </div>
    {/if}

    <button class="primary google" on:click={login} disabled={working || $authStore.loading}>
      {working ? 'redirecting…' : 'Continue with Google'}
    </button>

    <p class="privacy">Only the public Supabase client key is used. Your data is protected by database RLS.</p>
  </section>
</div>

<style>
  .login-page { min-height: calc(100dvh - 240px); display: grid; place-items: center; }
  .login-panel {
    width: min(100%, 520px); border: 1px solid var(--border-2); background: var(--bg-1);
    padding: 30px; border-radius: var(--radius); display: flex; flex-direction: column; gap: 18px;
    box-shadow: inset 0 0 45px rgba(0, 230, 118, 0.025);
  }
  .terminal-line { color: var(--fg-4); font-size: 11px; letter-spacing: .06em; }
  .prompt { color: var(--accent); margin-right: 7px; }
  h1 { font-size: 22px; color: var(--fg); letter-spacing: -.02em; }
  p { color: var(--fg-3); font-size: 12px; }
  .google { width: 100%; min-height: 42px; }
  .auth-error { border-left: 2px solid var(--danger); background: var(--danger-dim); padding: 10px 12px; color: var(--fg-2); font-size: 11px; }
  .auth-error span { color: var(--danger); }
  .privacy { font-size: 10px; color: var(--fg-4); }
</style>
