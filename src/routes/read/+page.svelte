<script>
	import { goto } from '$app/navigation';
	import { BIBLE_BOOKS, BOOK_ABBREVIATIONS, createSelectionManager, longpress, markSelectedAs, memorySelected } from '$lib/utils/helpers';
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import { headerTitle, headerAction, headerActionText } from '$lib/stores/header';

	const books = Object.keys(BIBLE_BOOKS);
	
	/** @type {string | null} */
	let selectedBook = null;
	
	/** @type {Set<string>} */
	let readChapters = new Set();
	
	const { selected, selectionMode, clear, handleLongPress, handleClick } = createSelectionManager();

	onMount(async () => {
		const progress = await db.reading_progress.toArray();
		readChapters = new Set(progress.filter((/** @type {any} */ p) => p.is_completed).map((/** @type {any} */ p) => p.id));
	});

	// Reactively bind to the top home app bar based on selectedBook state
	$: {
		if (selectedBook) {
			headerTitle.set(selectedBook);
			headerAction.set(() => { selectedBook = null; clear(); });
			headerActionText.set('Books');
		} else {
			headerTitle.set('Book selection');
			headerAction.set(null);
			headerActionText.set('Home');
		}
	}

	$: getBookProgress = (/** @type {string} */ book) => {
		const total = BIBLE_BOOKS[book];
		let completedCount = 0;
		for (let i = 1; i <= total; i++) {
			if (readChapters.has(`${book}_${i}`)) completedCount++;
		}
		return (completedCount / total) * 100;
	};
</script>

{#if !selectedBook}
	<!-- Book Grid -->
	<div 
		class="grid portrait:grid-cols-6 portrait:grid-rows-[11] landscape:grid-cols-11 landscape:grid-rows-6 gap-1 md:gap-2 w-full"
		style="height: calc(100dvh - 140px);"
	>
		{#each books as book}
			{@const percent = getBookProgress(book)}
			<button 
				class="relative flex h-full w-full flex-col items-center justify-center rounded p-0.5 md:p-1 shadow-sm transition-colors overflow-hidden select-none {percent > 50 ? 'text-white' : 'text-[var(--text-main)]'}"
				style="background-color: color-mix(in srgb, #22c55e {percent}%, var(--bg-card));"
				use:longpress
				on:longpress={() => handleLongPress(book)}
				on:click={() => handleClick(book, () => { clear(); selectedBook = book; })}
			>
				{#if $selected.has(book)}
					<div class="absolute inset-0 bg-[var(--theme-light)] border-[3px] border-[var(--theme-color)] rounded"></div>
				{/if}
				<span class="text-[0.65rem] sm:text-xs md:text-base lg:text-lg font-bold leading-none z-10">{percent === 100 ? '✓ '+ BOOK_ABBREVIATIONS[book]+' ✓':BOOK_ABBREVIATIONS[book]}</span>
				<span class="mt-0.5 sm:mt-1 w-full truncate text-center text-[0.45rem] sm:text-[0.55rem] md:text-xs leading-tight opacity-90 z-10">{book}</span>
			</button>
		{/each}
	</div>
{:else}
	<!-- Chapter Selection -->
	<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3 pb-24">
		{#each Array(BIBLE_BOOKS[selectedBook]) as _, i}
			{@const chapNum = i + 1}
			{@const isRead = readChapters.has(`${selectedBook}_${chapNum}`)}
			<button 
				use:longpress
				on:longpress={() => handleLongPress(chapNum)}
				on:click={() => handleClick(chapNum, () => { goto(`/read/${selectedBook}/${chapNum}`); })}
				class="relative flex aspect-square min-h-[56px] items-center justify-center rounded-lg text-xl font-bold shadow transition-colors md:text-xl select-none {isRead ? 'bg-green-600 text-white border-green-600' : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)]'} {$selected.has(chapNum) ? 'ring-4 ring-[var(--theme-color)] ring-inset' : ''}"
			>
				{chapNum}
			</button>
		{/each}
	</div>
{/if}

<SelectionActionBar selectedCount={$selected.size} onClear={clear}>
	<button on:click={() => markSelectedAs($selected, selectedBook, true, readChapters, db, (rc) => readChapters = rc, clear)} class="transition-colors hover:text-green-400">Mark Read</button>
	<button on:click={() => markSelectedAs($selected, selectedBook, false, readChapters, db, (rc) => readChapters = rc, clear)} class="transition-colors hover:text-[var(--text-muted)]">Mark Unread</button>
	<button on:click={() => memorySelected($selected, selectedBook, true, db, clear)} class="transition-colors hover:text-purple-400">+ Memory</button>
	<button on:click={() => memorySelected($selected, selectedBook, false, db, clear)} class="transition-colors hover:text-red-400">- Memory</button>
</SelectionActionBar>