<main class:dark={dark}>
	<Navbar />
	<svelte:component this={Route} {params} />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		height: 100vh;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<script>
	import { darkTheme } from './store.js'
	import { onDestroy } from 'svelte';
	import Navaid from 'navaid';
	import Navbar from './Navbar.svelte';

	let Route, params={}, active;
	let uri = location.pathname;
	$: active = uri.split('/')[1] || 'home';

	let dark;

	const unsubscribe = darkTheme.subscribe(value => {
		dark = value;
	})

	function run(thunk, obj) {
		const target = uri;

		thunk.then(m => {
			if (target !== uri) return;

			params = obj || {};

			if (m.preload) {
				m.preload({ params }).then(() => {
					if (target !== uri) return;
					Route = m.default;
					window.scrollTo(0, 0);
				});
			} else {
				Route = m.default;
				window.scrollTo(0, 0);
			}
		});
	}

	function track(obj) {
		uri = obj.state || obj.uri || location.pathname;
		if (window.ga) ga.send('pageview', { dp:uri });
	}

	addEventListener('replacestate', track);
	addEventListener('pushstate', track);
	addEventListener('popstate', track);

	const router = Navaid('/')
		.on('/', () => run(import('./Home.svelte')))
		.on('/:postid', obj => run(import('./Note.svelte'), obj))
		.listen();

	onDestroy(router.unlisten);
</script>