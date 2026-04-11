<script>
	import '../app.css';
</script>

<div class="container">
	<header>
		<a href="/" class="wordmark">
			<span class="wordmark-text">mindre</span><span class="blink">_</span>
		</a>
		<p class="tagline">flashcard study tool</p>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<span>↑↓←→ navigate · space flip · esc back</span>
	</footer>
</div>

<style>
	header {
		padding-bottom: 32px;
		margin-bottom: 48px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: baseline;
		gap: 20px;
	}

	.wordmark {
		font-size: 22px;
		font-weight: 700;
		color: var(--fg);
		letter-spacing: -0.02em;
		text-decoration: none;
	}

	.wordmark-text { color: var(--fg); }

	.tagline {
		font-size: 11px;
		color: var(--fg-4);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	main {
		min-height: calc(100vh - 200px);
	}

	footer {
		margin-top: 64px;
		padding-top: 20px;
		border-top: 1px solid var(--border);
		font-size: 10px;
		color: var(--fg-4);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
