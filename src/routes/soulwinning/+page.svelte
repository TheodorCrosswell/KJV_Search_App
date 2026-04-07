<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db/db';
	import { createSelectionManager, longpress, copySelected, favoriteSelected, locateSelected } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';

	/** @type {Array<{title: string, citations: string[], verses: any[]}>} */
	let topics = [
		{
			title: "Everyone is a sinner",
			citations: ["Romans 3:10", "Romans 3:23"],
			verses: []
		},
		{
			title: "Sin sends us to hell",
			citations: ["Romans 6:23", "Revelation 21:8"],
			verses: []
		}
	];

	/** @type {Set<any>} */
	let favoriteIds = new Set();
	/** @type {Array<any>} */
	let allVerses = []; // Flat list for selection actions

	const { selected, selectionMode, clear, handleLongPress, handleClick } = createSelectionManager();

	async function loadSoulwinningVerses() {
		const favs = await db.favorite_verses.toArray();
		favoriteIds = new Set(favs.map(f => f.id));

		/** @type {any[]} */
		let loadedVerses = [];

		for (let i = 0; i < topics.length; i++) {
			// Fetch the verses for this topic using the citation index
			const fetched = await db.kjv_text.where('citation').anyOf(topics[i].citations).toArray();
			
			// Sort the fetched verses to match the exact order of the citations array
			topics[i].verses = topics[i].citations
				.map(cit => fetched.find(v => v.citation === cit))
				.filter(Boolean); // Remove undefined if a verse wasn't found
			
			loadedVerses = [...loadedVerses, ...topics[i].verses];
		}
		
		allVerses = loadedVerses;
		topics = topics; // Trigger Svelte reactivity
	}

	onMount(() => {
		loadSoulwinningVerses();
	});

	/** @param {any} verse */
	async function toggleFavorite(verse) {
		if (favoriteIds.has(verse.id)) {
			await db.favorite_verses.delete(verse.id);
			favoriteIds.delete(verse.id);
		} else {
			await db.favorite_verses.put({
				id: verse.id,
				citation: verse.citation,
				timestamp: Date.now()
			});
			favoriteIds.add(verse.id);
		}
		favoriteIds = favoriteIds; 
	}
</script>

<div class="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
	<h1 class="text-3xl font-bold text-[var(--text-main)]">Soulwinning</h1>
</div>

{#each topics as topic}
	<div class="mb-8">
		<h2 class="mb-3 ml-1 text-xl font-bold text-[var(--text-main)]">{topic.title}</h2>
		<div class="space-y-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow sm:p-6">
			{#if topic.verses.length === 0}
				<p class="text-[var(--text-main)]">Loading verses...</p>
			{/if}
			{#each topic.verses as v}
				<div
					role="button"
					tabindex="0"
					class="group -mx-2 flex cursor-pointer select-none items-start gap-3 rounded p-2 transition-colors {$selected.has(v.id) ? 'bg-[var(--theme-light)]' : 'hover:bg-[var(--hover-bg)]'}"
					use:longpress
					on:longpress={() => handleLongPress(v.id)}
					on:click={() => handleClick(v.id, () => {})}
					on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(v.id, () => {})}
				>
					<!-- Replaced standard superscript verse number with a bolded reference citation for context -->
					<p class="flex-1 text-lg text-[var(--text-main)]">
						<span class="mr-2 text-sm font-bold text-[var(--theme-color)]">{v.citation}</span>
						{v.text}
					</p>
					
					<button 
						on:click|stopPropagation={() => toggleFavorite(v)}
						class="mt-1 text-2xl transition-colors {favoriteIds.has(v.id) ? 'text-red-500' : 'text-[var(--border-color)] hover:text-red-400'}"
						aria-label="Toggle Favorite"
					>
						♥
					</button>
				</div>
			{/each}
		</div>
	</div>
{/each}

<!-- Bottom padding to prevent the action bar from overlapping the last verse -->
<div class="h-32"></div>

<SelectionActionBar selectedCount={$selected.size} bottomClass="bottom-6" onClear={clear}>
	<button on:click={() => copySelected($selected, allVerses, clear)} class="transition-colors hover:text-[var(--theme-color)]">Copy</button>
	<button on:click={() => favoriteSelected($selected, allVerses, favoriteIds, db, (f) => favoriteIds = f, clear)} class="transition-colors hover:text-red-400">Favorite</button>
	<button on:click={() => locateSelected($selected, allVerses, goto)} class="transition-colors hover:text-green-400">Locate</button>
</SelectionActionBar>