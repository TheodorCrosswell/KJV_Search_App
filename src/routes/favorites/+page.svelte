<script>
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';

	let favoritesWithText = [];

	onMount(async () => {
		const favs = await db.favorite_verses.toArray();
		favs.sort((a, b) => b.timestamp - a.timestamp); // Newest first
		
		// Lookup the actual KJV text based on ID so we can display it nicely
		favoritesWithText = await Promise.all(favs.map(async (f) => {
			const verseData = await db.kjv_text.get(f.id);
			return { ...f, text: verseData?.text || 'Text not found.' };
		}));
	});

	async function removeFavorite(id) {
		await db.favorite_verses.delete(id);
		favoritesWithText = favoritesWithText.filter(f => f.id !== id);
	}
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">Favorite Verses</h1>
</div>

{#if favoritesWithText.length === 0}
	<div class="rounded-lg bg-white p-8 text-center shadow">
		<p class="text-gray-500">You haven't favorited any verses yet.</p>
		<p class="mt-2 text-sm text-gray-400">Read a chapter and click the heart icon (♥) to add verses to your favorites.</p>
		<a href="/read" class="mt-6 inline-block rounded bg-blue-600 px-6 py-2 text-white">Start Reading</a>
	</div>
{:else}
	<div class="space-y-4">
		{#each favoritesWithText as fav}
			<div class="relative rounded-lg bg-white p-4 pr-12 shadow">
				<h3 class="mb-1 font-bold text-blue-600">{fav.citation}</h3>
				<p class="mb-3 text-gray-800">{fav.text}</p>
				<p class="text-xs text-gray-400">Favorited on {new Date(fav.timestamp).toLocaleDateString()}</p>
				
				<button 
					on:click={() => removeFavorite(fav.id)}
					class="absolute right-4 top-4 text-2xl text-red-500 transition-colors hover:text-gray-300"
					aria-label="Remove favorite"
				>
					♥
				</button>
			</div>
		{/each}
	</div>
{/if}