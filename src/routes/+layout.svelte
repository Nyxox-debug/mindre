<script lang="ts">
  import "../app.css";
</script>

<div class="container">
  <header>
    <a href="/" class="wordmark">
      <span class="prefix">~/</span><span class="name">mindre</span><span
        class="blink">▌</span
      >
    </a>
    <nav class="header-right">
      <span class="tagline">flashcard · spaced repetition</span>
    </nav>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <span class="footer-hint">
      <kbd>←→</kbd> navigate&nbsp;&nbsp;
      <kbd>space</kbd> flip&nbsp;&nbsp;
      <kbd>esc</kbd> back
    </span>
    <span class="footer-version">v2.0</span>
  </footer>
</div>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
    margin-bottom: 40px;
    border-bottom: 1px solid var(--border-2);
    gap: 16px;
  }

  .wordmark {
    font-size: 18px;
    font-weight: 700;
    color: var(--fg);
    text-decoration: none;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 0;
  }

  .prefix {
    color: var(--fg-3);
    font-weight: 300;
  }

  .name {
    color: var(--accent);
    margin: 0 1px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tagline {
    font-size: 10px;
    color: var(--fg-4);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  main {
    min-height: calc(100dvh - 180px);
  }

  footer {
    margin-top: 56px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .footer-hint {
    font-size: 10px;
    color: var(--fg-4);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .footer-version {
    font-size: 10px;
    color: var(--fg-4);
    letter-spacing: 0.08em;
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

  @media (max-width: 480px) {
    .tagline {
      display: none;
    }
    footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }
</style>
