<script>
	import '../app.css'; // Imports TailwindCSS
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		if (pwaInfo) {
			// Dynamically load the service worker registration only on the client
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					console.log('Service Worker Registered');
				},
				onRegisterError(error) {
					console.error('Service Worker Registration Error', error);
				}
			});
		}
	});
</script>

<!-- CORRECT: <svelte:head> is at the root level of the component -->
<svelte:head>
	{#if pwaInfo}
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

<!-- Renders your pages -->
<main class="min-h-screen bg-gray-50 p-8 text-gray-900">
	{@render children()}
</main>
