<script>
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSelectionManager, copySelected, locateSelected } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import VerseList from '$lib/components/VerseList.svelte';
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

	async function removeSelectedFavorites() {
		for (const id of $selected) {
			await db.favorite_verses.delete(id);
		}
		favoritesWithText = favoritesWithText.filter(f => !$selected.has(f.id));
		clear();
	}
</script>

{#if favoritesWithText.length === 0}
	<div class="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-8 text-center shadow">
		<p class="text-[var(--text-muted)]">You haven't favorited any verses yet.</p>
		<p class="mt-2 text-sm text-[var(--text-muted)] opacity-80">Read a chapter and click the heart icon (♥) to add verses to your favorites.</p>
		<a href="/read" class="mt-6 inline-block rounded bg-[var(--theme-color)] px-6 py-2 text-white hover:opacity-80 transition-opacity">Start Reading</a>
	</div>
{:else}
	<div class="pb-24">
		<VerseList 
			verses={favoritesWithText}
			selected={$selected}
			{handleLongPress}
			{handleClick}
			fallbackMessage=""
		>
			<svelte:fragment let:verse={fav}>
				<div class="flex-1 text-left">
					<h3 class="mb-1 font-bold text-[var(--theme-color)]">{fav.citation}</h3>
					<p class="mb-3 text-[var(--text-main)]">{fav.text}</p>
					<p class="text-xs text-[var(--text-muted)]">Favorited on {new Date(fav.timestamp).toLocaleDateString()}</p>
				</div>
			</svelte:fragment>
		</VerseList>
	</div>
{/if}

<SelectionActionBar selectedCount={$selected.size} onClear={clear}>
	<button on:click={() => copySelected($selected, favoritesWithText, clear)} class="transition-colors hover:text-[var(--theme-color)]">Copy</button>
	<button on:click={removeSelectedFavorites} class="transition-colors hover:text-red-400">Remove</button>
	<button on:click={() => locateSelected($selected, favoritesWithText, goto)} class="transition-colors hover:text-green-400">Locate</button>
</SelectionActionBar>