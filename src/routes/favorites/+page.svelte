<script>
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSelectionManager, longpress } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import { headerTitle, headerAction } from '$lib/stores/header';

	$: headerTitle.set('Favorite Verses');
	$: headerAction.set(null);

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

{#if favoritesWithText.length === 0}
	<div class="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-8 text-center shadow">
		<p class="text-[var(--text-muted)]">You haven't favorited any verses yet.</p>
		<p class="mt-2 text-sm text-[var(--text-muted)] opacity-80">Read a chapter and click the heart icon (♥) to add verses to your favorites.</p>
		<a href="/read" class="mt-6 inline-block rounded bg-[var(--theme-color)] px-6 py-2 text-white hover:opacity-80 transition-opacity">Start Reading</a>
	</div>
{:else}
	<div class="space-y-4 pb-24">
		{#each favoritesWithText as fav}
			<div 
				role="button"
				tabindex="0"
				class="relative rounded-lg p-4 pr-12 shadow border border-[var(--border-color)] cursor-pointer select-none transition-colors {$selected.has(fav.id) ? 'bg-[var(--theme-light)]' : 'bg-[var(--bg-card)] hover:bg-[var(--hover-bg)]'}"
				use:longpress
				on:longpress={() => handleLongPress(fav.id)}
				on:click={() => handleClick(fav.id, () => {})}
				on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(fav.id, () => {})}
			>
				<h3 class="mb-1 font-bold text-[var(--theme-color)]">{fav.citation}</h3>
				<p class="mb-3 text-[var(--text-main)]">{fav.text}</p>
				<p class="text-xs text-[var(--text-muted)]">Favorited on {new Date(fav.timestamp).toLocaleDateString()}</p>
				
				<button 
					on:click|stopPropagation={() => removeFavorite(fav.id)}
					class="absolute right-4 top-4 text-2xl text-red-500 transition-colors hover:text-red-400"
					aria-label="Remove favorite"
				>
					♥
				</button>
			</div>
		{/each}
	</div>
{/if}

<SelectionActionBar selectedCount={$selected.size} onClear={clear}>
	<button on:click={copySelected} class="transition-colors hover:text-[var(--theme-color)]">Copy</button>
	<button on:click={locateSelected} class="transition-colors hover:text-green-400">Locate</button>
</SelectionActionBar>