<script lang="ts">
  import { browser } from '$app/environment';

  export let code: string;
  export let language: string = 'javascript';

  let highlighted = '';
  let copied = false;
  let highlightRequest = 0;

  async function highlightCode(source: string, selectedLanguage: string) {
    if (!browser) return;
    const request = ++highlightRequest;
    const hljs = (await import('highlight.js')).default;
    const value = (() => {
      try {
        return hljs.highlight(source, { language: selectedLanguage }).value;
      } catch {
        return hljs.highlightAuto(source).value;
      }
    })();

    if (request === highlightRequest) highlighted = value;
  }

  $: {
    highlighted = '';
    void highlightCode(code, language);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => { copied = false; }, 1500);
  }
</script>

<div class="code-block">
  <div class="code-header">
    <span class="lang-tag">{language}</span>
    <button class="copy-btn" on:click|stopPropagation={copyCode}>
      {copied ? '✓ copied' : 'copy'}
    </button>
  </div>
  <pre>{#if highlighted}<code class="hljs language-{language}">{@html highlighted}</code>{:else}<code class="hljs language-{language}">{code}</code>{/if}</pre>
</div>

<style>
  .code-block {
    width: 100%;
    background: var(--bg-code);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    overflow: hidden;
    text-align: left;
  }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    background: var(--bg-3);
    border-bottom: 1px solid var(--border);
  }

  .lang-tag {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
  }

  .copy-btn {
    font-size: 9px;
    padding: 2px 8px;
    border: 1px solid var(--border-2);
    background: transparent;
    color: var(--fg-4);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: var(--radius);
    transition: all 0.15s;
    font-family: var(--font);
    white-space: nowrap;
  }

  .copy-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.7;
  }

  code {
    font-family: var(--font);
    background: none;
    padding: 0;
  }

  /* scrollbar inside code */
  pre::-webkit-scrollbar { height: 3px; }
  pre::-webkit-scrollbar-track { background: transparent; }
  pre::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 2px; }
</style>
