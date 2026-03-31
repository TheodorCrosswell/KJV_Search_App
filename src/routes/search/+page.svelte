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

	// --- Search History & Highlighting State ---
	/** @type {Array<string>} */
	let recentSearches = [];
	/** @type {Array<string>} */
	let currentSearchWords = [];

	// --- Filter State ---
	let selectedCategory = 'All';

	/** @type {Record<string, string[]>} */
	const BOOK_CATEGORIES = {
		"Old Testament": ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"],
		"New Testament": ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"],
		"Pentateuch / Law": ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"],
		"Historical Books (OT)": ["Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther"],
		"Wisdom & Poetry": ["Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"],
		"Major Prophets": ["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel"],
		"Minor Prophets": ["Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"],
		"Gospels": ["Matthew", "Mark", "Luke", "John"],
		"History (NT)": ["Acts"],
		"Pauline Epistles": ["Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon"],
		"Pastoral Epistles": ["1 Timothy", "2 Timothy", "Titus"],
		"General Epistles": ["Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude"],
		"Apocalyptic / Prophecy": ["Revelation"]
	};

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

		// Load search history
		try {
			const savedHistory = localStorage.getItem('recentSearches');
			if (savedHistory) {
				recentSearches = JSON.parse(savedHistory);
			}
		} catch (e) {
			console.error("Failed to load search history", e);
		}
	});

	/** @param {string} string */
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	async function handleSearch() {
		const searchWords = query.trim().split(/\s+/).filter(w => w.length > 0);
		if (searchWords.length === 0) return;

		isSearching = true;
		clearSelection(); // Reset selection on new search

		// Update History Queue (FIFO - Max 10)
		const queryStr = query.trim();
		let newHistory = recentSearches.filter(q => q.toLowerCase() !== queryStr.toLowerCase());
		newHistory.unshift(queryStr);
		if (newHistory.length > 10) {
			newHistory.pop();
		}
		recentSearches = newHistory;
		try {
			localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
		} catch (e) {}

		currentSearchWords = searchWords;
		
		try {
			const allowedBooks = selectedCategory === 'All' ? null : BOOK_CATEGORIES[selectedCategory];
			const wordRegexes = searchWords.map(sw => new RegExp(`\\b${escapeRegExp(sw)}`, 'i'));
			
			results = await db.kjv_text.filter((v) => {
				// Verify book matches selected filter criteria
				if (allowedBooks && !allowedBooks.includes(v.book)) return false;

				// Verify the verse text matches EVERY word regex constraint
				return wordRegexes.every(regex => regex.test(v.text));
			}).toArray();
		} catch (e) {
			alert('Search process error');
		}
		isSearching = false;
	}

	/** @param {string} text */
	function highlight(text) {
		if (!currentSearchWords || currentSearchWords.length === 0) return text;
		
		// Sort words by length descending to match longest possible prefixes first
		const pattern = currentSearchWords.map(escapeRegExp).sort((a,b) => b.length - a.length).join('|');
		
		// Match the beginning of a word (\b), one of our prefixes, and the rest of the word letters/apostrophes/hyphens
		const regex = new RegExp(`\\b(${pattern})[a-zA-Z0-9'\\-]*`, 'gi');
		
		return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900 rounded-sm px-1">$&</mark>');
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

<h1 class="mb-4 text-2xl font-bold">Bible Search</h1>

<div class="mb-6 flex flex-col gap-3 sm:flex-row">
	<input
		type="text"
		bind:value={query}
		placeholder="Search here."
		class="flex-1 rounded border p-3 shadow-sm ring-blue-500 outline-none focus:ring-2"
		on:keydown={(e) => e.key === 'Enter' && handleSearch()}
	/>
	<div class="flex w-full gap-2 sm:w-auto">
		<select
			bind:value={selectedCategory}
			class="flex-1 rounded border bg-white p-3 text-gray-700 shadow-sm ring-blue-500 outline-none focus:ring-2 sm:w-48"
		>
			<option value="All">All Books</option>
			{#each Object.keys(BOOK_CATEGORIES) as category}
				<option value={category}>{category}</option>
			{/each}
		</select>
		<button on:click={handleSearch} class="rounded bg-blue-600 px-6 py-3 font-semibold text-white">
			Search
		</button>
	</div>
</div>

{#if recentSearches.length > 0}
	<div class="mb-6">
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Recent Searches</h2>
		<div class="flex flex-wrap gap-2">
			{#each recentSearches as rq}
				<button
					class="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={() => query = rq}
				>
					{rq}
				</button>
			{/each}
		</div>
	</div>
{/if}

{#if isSearching}
	<p>Searching...</p>
{:else}
	<p class="mb-4 text-gray-500">{results.length} results found.</p>
	<div class="space-y-3 pb-24">
		{#each results as res}
			<!-- svelte-ignore a11y-interactive-supports-focus -->
			<div
				role="button"
				class="group flex cursor-pointer select-none items-start gap-4 rounded p-4 shadow transition-colors {selectedVerses.has(res.id) ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'}"
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
					<p class="text-gray-800">{@html highlight(res.text)}</p>
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
		<div class="flex items-center gap-3 text-sm font-medium sm:gap-4">
			<button on:click={copySelected} class="transition-colors hover:text-blue-300">Copy</button>
			<button on:click={favoriteSelected} class="transition-colors hover:text-red-300">Favorite</button>
			<button on:click={locateSelected} class="transition-colors hover:text-green-300">Locate</button>
			<div class="h-4 w-px bg-gray-600"></div>
			<button on:click={clearSelection} class="text-gray-400 transition-colors hover:text-white" aria-label="Cancel Selection">✕</button>
		</div>
	</div>
{/if}