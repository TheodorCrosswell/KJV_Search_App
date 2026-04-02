<script>
	import { db } from '$lib/db/db';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createSelectionManager, longpress } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import { headerTitle, headerAction } from '$lib/stores/header';

	$: headerTitle.set('Bible Search');
	$: headerAction.set(null);

	let query = '';
	/** @type {Array<any>} */
	let results = [];
	let isSearching = false;

	/** @type {Set<any>} */
	let favoriteIds = new Set(); 

	/** @type {string[]} */
	let recentSearches = [];
	/** @type {string[]} */
	let currentSearchWords = [];

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

	const { selected, selectionMode, clear, handleLongPress, handleClick } = createSelectionManager();

	onMount(async () => {
		const favs = await db.favorite_verses.toArray();
		favoriteIds = new Set(favs.map(f => f.id));

		try {
			const savedHistory = localStorage.getItem('recentSearches');
			if (savedHistory) recentSearches = JSON.parse(savedHistory);
		} catch (e) {}
	});

	/** @param {string} string */
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	async function handleSearch() {
		const searchWords = query.trim().split(/\s+/).filter(w => w.length > 0);
		if (searchWords.length === 0) return;

		isSearching = true;
		clear(); 

		const queryStr = query.trim();
		let newHistory = recentSearches.filter(q => q.toLowerCase() !== queryStr.toLowerCase());
		newHistory.unshift(queryStr);
		if (newHistory.length > 10) newHistory.pop();
		recentSearches = newHistory;
		
		try { localStorage.setItem('recentSearches', JSON.stringify(recentSearches)); } catch (e) {}

		currentSearchWords = searchWords;
		
		try {
			const allowedBooks = selectedCategory === 'All' ? null : BOOK_CATEGORIES[selectedCategory] || null;
			const wordRegexes = searchWords.map(sw => new RegExp(`\\b${escapeRegExp(sw)}`, 'i'));
			
			results = await db.kjv_text.filter((v) => {
				if (allowedBooks && !allowedBooks.includes(v.book)) return false;
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
		const pattern = currentSearchWords.map(escapeRegExp).sort((a,b) => b.length - a.length).join('|');
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
		favoriteIds = favoriteIds; 
	}

	async function copySelected() {
		const sortedVerses = results.filter(v => $selected.has(v.id));
		const textToCopy = sortedVerses.map(v => `${v.citation} ${v.text}`).join('\n');
		try { await navigator.clipboard.writeText(textToCopy); } catch (err) {}
		clear();
	}

	async function favoriteSelected() {
		const sortedVerses = results.filter(v => $selected.has(v.id));
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
		favoriteIds = favoriteIds; 
		clear();
	}

	function locateSelected() {
		const firstSelectedId = Array.from($selected)[0];
		const targetVerse = results.find(v => v.id === firstSelectedId);
		if (targetVerse) {
			goto(`/read/${targetVerse.book}/${targetVerse.chapter}`);
		}
	}
</script>

<div class="mb-6 flex flex-col gap-3 sm:flex-row">
	<input type="text" bind:value={query} placeholder="Search here." class="flex-1 rounded border p-3 shadow-sm ring-blue-500 outline-none focus:ring-2" on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleSearch()} />
	<div class="flex w-full gap-2 sm:w-auto">
		<select bind:value={selectedCategory} class="flex-1 rounded border bg-white p-3 text-gray-700 shadow-sm ring-blue-500 outline-none focus:ring-2 sm:w-48">
			<option value="All">All Books</option>
			{#each Object.keys(BOOK_CATEGORIES) as category}
				<option value={category}>{category}</option>
			{/each}
		</select>
		<button on:click={handleSearch} class="rounded bg-blue-600 px-6 py-3 font-semibold text-white">Search</button>
	</div>
</div>

{#if recentSearches.length > 0}
	<div class="mb-6">
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Recent Searches</h2>
		<div class="flex flex-wrap gap-2">
			{#each recentSearches as rq}
				<button class="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200" on:click={() => { query = rq; handleSearch(); }}>{rq}</button>
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
			<div
				role="button"
				tabindex="0"
				class="group flex cursor-pointer select-none items-start gap-4 rounded p-4 shadow transition-colors {$selected.has(res.id) ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'}"
				use:longpress
				on:longpress={() => handleLongPress(res.id)}
				on:click={() => handleClick(res.id, () => {})}
				on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(res.id, () => {})}
			>
				<div class="flex-1 text-left">
					<h3 class="mb-1 font-bold {$selected.has(res.id) ? 'text-blue-800' : 'text-blue-600'}">{res.citation}</h3>
					<p class="text-gray-800">{@html highlight(res.text)}</p>
				</div>
				<button on:click|stopPropagation={() => toggleFavorite(res)} class="mt-1 text-2xl transition-colors {favoriteIds.has(res.id) ? 'text-red-500' : 'text-gray-200 hover:text-red-300'}" aria-label="Toggle Favorite">♥</button>
			</div>
		{/each}
	</div>
{/if}

<SelectionActionBar selectedCount={$selected.size} onClear={clear}>
	<button on:click={copySelected} class="transition-colors hover:text-blue-300">Copy</button>
	<button on:click={favoriteSelected} class="transition-colors hover:text-red-300">Favorite</button>
	<button on:click={locateSelected} class="transition-colors hover:text-green-300">Locate</button>
</SelectionActionBar>