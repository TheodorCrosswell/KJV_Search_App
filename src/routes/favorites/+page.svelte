<script>
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSelectionManager, longpress } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';

	/** @type {Array<any>} */
	let favoritesWithText = [];

	const { selected, selectionMode, clear, handleLongPress, handleClick } = createSelectionManager();

	onMount(async () => {
		const favs = await db.favorite_verses.toArray();
		favs.sort((a, b) => b.timestamp - a.timestamp); 
		
		favoritesWithText = await Promise.all(favs.map(async (f) => {
			const verseData = await db.kjv_text.get(f.id);
			return { ...f, text: verseData?.text || 'Text not found.', book: verseData?.book, chapter: verseData?.chapter };
		}));
	});

	/** @param {number|string} id */
	async function removeFavorite(id) {
		await db.favorite_verses.delete(id);
		favoritesWithText = favoritesWithText.filter(f => f.id !== id);
	}

	async function copySelected() {
		const sortedVerses = favoritesWithText.filter(v => $selected.has(v.id));
		const textToCopy = sortedVerses.map(v => `${v.citation} ${v.text}`).join('\n');
		
		try { await navigator.clipboard.writeText(textToCopy); } catch (err) {}
		clear();
	}

	function locateSelected() {
		const firstSelectedId = Array.from($selected)[0];
		const targetVerse = favoritesWithText.find(v => v.id === firstSelectedId);
		
		if (targetVerse && targetVerse.book) {
			goto(`/read/${targetVerse.book}/${targetVerse.chapter}`);
		}
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
	<div class="space-y-4 pb-24">
		{#each favoritesWithText as fav}
			<div 
				role="button"
				tabindex="0"
				class="relative rounded-lg p-4 pr-12 shadow cursor-pointer select-none transition-colors {$selected.has(fav.id) ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'}"
				use:longpress
				on:longpress={() => handleLongPress(fav.id)}
				on:click={() => handleClick(fav.id, () => {})}
				on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(fav.id, () => {})}
			>
				<h3 class="mb-1 font-bold {$selected.has(fav.id) ? 'text-blue-800' : 'text-blue-600'}">{fav.citation}</h3>
				<p class="mb-3 text-gray-800">{fav.text}</p>
				<p class="text-xs text-gray-400">Favorited on {new Date(fav.timestamp).toLocaleDateString()}</p>
				
				<button 
					on:click|stopPropagation={() => removeFavorite(fav.id)}
					class="absolute right-4 top-4 text-2xl text-red-500 transition-colors hover:text-gray-300"
					aria-label="Remove favorite"
				>
					♥
				</button>
			</div>
		{/each}
	</div>
{/if}

<SelectionActionBar selectedCount={$selected.size} onClear={clear}>
	<button on:click={copySelected} class="transition-colors hover:text-blue-300">Copy</button>
	<button on:click={locateSelected} class="transition-colors hover:text-green-300">Locate</button>
</SelectionActionBar>