<script>
	import { db } from '$lib/db/db';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let query = '';
	/** @type {Array<any>} */
	let results = [];
	let isSearching = false;

	/** @type {Set<any>} */
	let favoriteIds = new Set(); // To color favorite hearts

	// --- Selection State ---
	let selectionMode = false;
	/** @type {Set<any>} */
	let selectedVerses = new Set();
	/** @type {any} */
	let pressTimer;
	let justLongPressed = false;

	onMount(async () => {
		const favs = await db.favorite_verses.toArray();
		favoriteIds = new Set(favs.map(f => f.id));
	});

	async function handleSearch() {
		if (!query) return;
		isSearching = true;
		clearSelection(); // Reset selection on new search
		
		try {
			const regex = new RegExp(query, 'i');
			results = await db.kjv_text.filter((v) => regex.test(v.text)).toArray();
		} catch (e) {
			alert('Invalid Regex');
		}
		isSearching = false;
	}

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
		favoriteIds = favoriteIds; // Force reactivity update
	}

	// --- Selection & Action Bar Methods ---
	/** @param {any} verse */
	function startPress(verse) {
		if (selectionMode) return;
		pressTimer = setTimeout(() => {
			selectionMode = true;
			justLongPressed = true;
			toggleVerseSelection(verse);
			if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
			setTimeout(() => justLongPressed = false, 1000);
		}, 500); // 500ms long press threshold
	}

	function cancelPress() {
		clearTimeout(pressTimer);
	}

	/** @param {any} verse */
	function handleClick(verse) {
		if (justLongPressed) {
			justLongPressed = false;
			return; // Ignore the initial click generated after letting go of a long press
		}
		if (selectionMode) {
			toggleVerseSelection(verse);
		}
	}

	/** @param {any} verse */
	function toggleVerseSelection(verse) {
		if (selectedVerses.has(verse.id)) {
			selectedVerses.delete(verse.id);
			if (selectedVerses.size === 0) {
				selectionMode = false;
			}
		} else {
			selectedVerses.add(verse.id);
		}
		selectedVerses = selectedVerses; // trigger reactivity update
	}

	function clearSelection() {
		selectionMode = false;
		selectedVerses.clear();
		selectedVerses = selectedVerses;
	}

	async function copySelected() {
		const sortedVerses = results.filter(v => selectedVerses.has(v.id));
		const textToCopy = sortedVerses.map(v => `${v.citation} ${v.text}`).join('\n');
		
		try {
			await navigator.clipboard.writeText(textToCopy);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
		clearSelection();
	}

	async function favoriteSelected() {
		const sortedVerses = results.filter(v => selectedVerses.has(v.id));
		for (let v of sortedVerses) {
			if (!favoriteIds.has(v.id)) {
				await db.favorite_verses.put({
					id: v.id,
					citation: v.citation,
					timestamp: Date.now()
				});
				favoriteIds.add(v.id);
			}
		}
		favoriteIds = favoriteIds; // Force reactivity
		clearSelection();
	}

	function locateSelected() {
		// Take the user to the chapter of the first verse they selected
		const firstSelectedId = Array.from(selectedVerses)[0];
		const targetVerse = results.find(v => v.id === firstSelectedId);
		
		if (targetVerse) {
			goto(`/read/${targetVerse.book}/${targetVerse.chapter}`);
		}
	}
</script>

<h1 class="mb-4 text-2xl font-bold">Regex Bible Search</h1>

<div class="mb-6 flex gap-2">
	<input
		type="text"
		bind:value={query}
		placeholder="e.g. \bGod\b.*\bworld\b"
		class="flex-1 rounded border p-3 shadow-sm ring-blue-500 outline-none focus:ring-2"
		on:keydown={(e) => e.key === 'Enter' && handleSearch()}
	/>
	<button on:click={handleSearch} class="rounded bg-blue-600 px-6 py-3 font-semibold text-white">
		Search
	</button>
</div>

{#if isSearching}
	<p>Searching...</p>
{:else}
	<p class="mb-4 text-gray-500">{results.length} results found.</p>
	<div class="space-y-3 pb-24">
		{#each results as res}
			<!-- svelte-ignore a11y-interactive-supports-focus -->
			<div
				role="button"
				class="flex cursor-pointer select-none items-start gap-4 rounded p-4 shadow transition-colors group {selectedVerses.has(res.id) ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'}"
				on:touchstart={() => startPress(res)}
				on:touchend={cancelPress}
				on:touchmove={cancelPress}
				on:mousedown={() => startPress(res)}
				on:mouseup={cancelPress}
				on:mouseleave={cancelPress}
				on:click={() => handleClick(res)}
				on:keydown={(e) => e.key === 'Enter' && handleClick(res)}
				on:contextmenu|preventDefault
			>
				<div class="flex-1 text-left">
					<h3 class="mb-1 font-bold {selectedVerses.has(res.id) ? 'text-blue-800' : 'text-blue-600'}">{res.citation}</h3>
					<p class="text-gray-800">{res.text}</p>
				</div>
				<!-- Favorite Toggle Button -->
				<button 
					on:click|stopPropagation={() => toggleFavorite(res)}
					class="mt-1 text-2xl transition-colors {favoriteIds.has(res.id) ? 'text-red-500' : 'text-gray-200 hover:text-red-300'}"
					aria-label="Toggle Favorite"
				>
					♥
				</button>
			</div>
		{/each}
	</div>
{/if}

<!-- Verses Selected Action Bar -->
{#if selectionMode}
	<div class="fixed bottom-6 left-0 right-0 z-50 mx-auto flex w-[95%] max-w-lg items-center justify-between rounded-full bg-gray-900 px-6 py-4 text-white shadow-2xl transition-transform">
		<span class="font-semibold">{selectedVerses.size} selected</span>
		<div class="flex items-center gap-3 sm:gap-4 text-sm font-medium">
			<button on:click={copySelected} class="transition-colors hover:text-blue-300">Copy</button>
			<button on:click={favoriteSelected} class="transition-colors hover:text-red-300">Favorite</button>
			<button on:click={locateSelected} class="transition-colors hover:text-green-300">Locate</button>
			<div class="h-4 w-px bg-gray-600"></div>
			<button on:click={clearSelection} class="text-gray-400 transition-colors hover:text-white" aria-label="Cancel Selection">✕</button>
		</div>
	</div>
{/if}