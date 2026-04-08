<script>
	import { db } from '$lib/db/db';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createSelectionManager, copySelected, favoriteSelected, locateSelected } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import VerseList from '$lib/components/VerseList.svelte';
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
		return text.replace(regex, '<mark class="bg-yellow-500/40 text-[var(--text-main)] rounded-sm px-1">$&</mark>');
	}
</script>

<div class="mb-6 flex flex-col gap-3 sm:flex-row">
	<input type="text" bind:value={query} placeholder="Search here." class="flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] p-3 shadow-sm ring-[var(--theme-color)] outline-none focus:ring-2" on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleSearch()} />
	<div class="flex w-full gap-2 sm:w-auto">
		<select bind:value={selectedCategory} class="flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-[var(--text-main)] shadow-sm ring-[var(--theme-color)] outline-none focus:ring-2 sm:w-48">
			<option value="All">All Books</option>
			{#each Object.keys(BOOK_CATEGORIES) as category}
				<option value={category}>{category}</option>
			{/each}
		</select>
		<button on:click={handleSearch} class="rounded bg-[var(--theme-color)] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-80">Search</button>
	</div>
</div>

{#if recentSearches.length > 0}
	<div class="mb-6">
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Recent Searches</h2>
		<div class="flex flex-wrap gap-2">
			{#each recentSearches as rq}
				<!-- Removed handleSearch() from the on:click so it just fills the input -->
				<button class="rounded-full bg-[var(--hover-bg)] px-4 py-1.5 text-sm text-[var(--text-main)] transition hover:opacity-80" on:click={() => query = rq }>{rq}</button>
			{/each}
		</div>
	</div>
{/if}

{#if isSearching}
	<p class="text-[var(--text-main)]">Searching...</p>
{:else}
	<p class="mb-4 text-[var(--text-muted)]">{results.length} results found.</p>
	<div class="pb-24">
		<VerseList 
			verses={results}
			selected={$selected}
			{handleLongPress}
			{handleClick}
			fallbackMessage=""
		>
			<svelte:fragment let:verse={res}>
				<div class="flex-1 text-left">
					<h3 class="mb-1 font-bold text-[var(--theme-color)]">{res.citation}</h3>
					<p class="text-[var(--text-main)]">{@html highlight(res.text)}</p>
				</div>
			</svelte:fragment>
		</VerseList>
	</div>
{/if}

<SelectionActionBar selectedCount={$selected.size} onClear={clear}>
	<button on:click={() => copySelected($selected, results, clear)} class="transition-colors hover:text-[var(--theme-color)]">Copy</button>
	<button on:click={() => favoriteSelected($selected, results, favoriteIds, db, (f) => favoriteIds = f, clear)} class="transition-colors hover:text-red-400">Favorite</button>
	<button on:click={() => locateSelected($selected, results, goto)} class="transition-colors hover:text-green-400">Locate</button>
</SelectionActionBar>