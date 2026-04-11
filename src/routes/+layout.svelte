<script>
	import '../app.css';
</script>

<div class="container">
	<header>
		<a href="/" class="logo">
			<h1>mindre<span class="blink">_</span></h1>
		</a>
	</header>
	
	<main>
		<slot />
	</main>
</div>

<style>
	header {
		margin-bottom: var(--space-xxl);
		padding-bottom: var(--space-lg);
		border-bottom: 1px solid var(--border);
	}
	
	.logo {
		color: var(--fg);
		text-decoration: none;
	}
	
	.logo:hover {
		text-decoration: none;
	}
	
	.logo h1 {
		display: inline;
	}
	
	main {
		min-height: calc(100vh - 150px);
	}
</style>