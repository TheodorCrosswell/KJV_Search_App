<script>
	import { page } from '$app/stores';
	import { tick } from 'svelte';
	import { db } from '$lib/db/db';
	import { BIBLE_BOOKS, TOTAL_CHAPTERS, createSelectionManager, copySelected, favoriteSelected } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import VerseList from '$lib/components/VerseList.svelte';

	$: book = $page.params.book;
	$: chapter = parseInt($page.params.chapter);

	/** @type {Array<any>} */
	let verses = [];
	let isCompleted = false;
	let isInMemoryQueue = false;
	
	/** @type {Set<any>} */
	let favoriteIds = new Set(); 

	const { selected, selectionMode, clear, handleLongPress, handleClick } = createSelectionManager();

	$: maxChapter = BIBLE_BOOKS[book] || 1;

	async function loadChapter() {
		verses = []; 
		clear();
		verses = await db.kjv_text.where({ book, chapter }).toArray();
		verses.sort((a, b) => a.verse - b.verse);

		const progressId = `${book}_${chapter}`;
		const progress = await db.reading_progress.get(progressId);
		isCompleted = progress?.is_completed || false;

		const memoryItem = await db.memory_queue.get(progressId);
		isInMemoryQueue = !!memoryItem;

		await db.latest_reading.put({ id: 1, book, chapter });

		const favs = await db.favorite_verses.toArray();
		favoriteIds = new Set(favs.map(f => f.id));

		// Highlight and scroll to the located verse if coming from search/favorites
		const targetVerseId = $page.url.searchParams.get('v');
		if (targetVerseId) {
			const idNum = parseInt(targetVerseId);
			// Simulate click to apply the custom selected states natively
			handleClick(idNum, () => {}, true);
			
			// Wait for Svelte to finish rendering the DOM
			await tick();
			
			// Adding a tiny delay guarantees accurate positioning of smooth scroll
			setTimeout(() => {
				const el = document.getElementById(`verse-${idNum}`);
				if (el) {
					el.scrollIntoView({ behavior: 'auto', block: 'center' });
				}
			}, 50);
		}
	}

	$: if (book && chapter) loadChapter();

	async function toggleComplete() {
		const progressId = `${book}_${chapter}`;
		
		if (!isCompleted) {
			await db.reading_progress.put({ id: progressId, completion_date: Date.now(), is_completed: true });
			isCompleted = true;
			
			const allProgress = await db.reading_progress.toArray();
			const completedCount = allProgress.filter(/** @type {any} */ p => p.is_completed).length;
			
			if (completedCount >= TOTAL_CHAPTERS) {
				const confirmReset = confirm("Congratulations! You have read the entire Bible! Do you want to increment your completion count and reset your progress?");
				if (confirmReset) {
					const countsRecord = await db.metadata.get('completion_counts');
					const counts = countsRecord ? countsRecord.value : 0;
					await db.metadata.put({ key: 'completion_counts', value: counts + 1 });
					
					const updatedProgress = allProgress.map(/** @type {any} */ p => ({ ...p, is_completed: false }));
					await db.reading_progress.bulkPut(updatedProgress);
					isCompleted = false;
				}
			}
		} else {
			await db.reading_progress.put({ id: progressId, completion_date: Date.now(), is_completed: false });
			isCompleted = false;
		}
	}

	async function toggleMemoryQueue() {
		const progressId = `${book}_${chapter}`;
		if (!isInMemoryQueue) {
			await db.memory_queue.put({ citation: progressId });
			isInMemoryQueue = true;
		} else {
			await db.memory_queue.delete(progressId);
			isInMemoryQueue = false;
		}
	}
</script>

<div class="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
	<h1 class="text-2xl font-bold text-[var(--text-main)]">{book} {chapter}</h1>
	<div class="flex flex-wrap gap-2">
		<button on:click={toggleMemoryQueue} class="rounded px-4 py-2 transition-colors {isInMemoryQueue ? 'bg-purple-600 text-white' : 'bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:opacity-80'}">
			{isInMemoryQueue ? 'In Memory Queue' : 'Add to Memory Queue'}
		</button>
		<button on:click={toggleComplete} class="rounded px-4 py-2 transition-colors {isCompleted ? 'bg-green-600 text-white' : 'bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:opacity-80'}">
			{isCompleted ? 'Completed' : 'Mark Complete'}
		</button>
	</div>
</div>

<VerseList 
	{verses}
	selected={$selected}
	{handleLongPress}
	{handleClick}
	fallbackMessage="Loading verses..."
/>

<div class="h-32"></div>

<SelectionActionBar selectedCount={$selected.size} bottomClass="bottom-24" onClear={clear}>
	<button on:click={() => copySelected($selected, verses, clear)} class="transition-colors hover:text-[var(--theme-color)]">Copy</button>
	<button on:click={() => favoriteSelected($selected, verses, favoriteIds, db, (f) => favoriteIds = f, clear)} class="transition-colors hover:text-red-400">Favorite</button>
</SelectionActionBar>

<div class="pointer-events-none fixed bottom-6 left-0 right-0 z-40 mx-auto flex w-full max-w-4xl justify-between gap-2 px-4">
	<!-- Left Side: Prev -->
	<div class="flex flex-1 justify-start">
		{#if chapter > 1}
			<a href="/read/{book}/{chapter - 1}" class="pointer-events-auto rounded-full bg-[var(--theme-color)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 hover:opacity-90 md:px-6 md:text-base">
				&larr; Prev
			</a>
		{/if}
	</div>

	<!-- Center: Locate -->
	<div class="flex flex-1 justify-center">
		<a href="/read" class="pointer-events-auto flex items-center justify-center rounded-full bg-[var(--text-main)] px-5 py-3 text-sm font-semibold text-[var(--bg-main)] shadow-lg transition-transform active:scale-95 hover:opacity-90 md:px-6 md:text-base">
			Locate
		</a>
	</div>

	<!-- Right Side: Next -->
	<div class="flex flex-1 justify-end">
		{#if chapter < maxChapter}
			<a href="/read/{book}/{chapter + 1}" class="pointer-events-auto rounded-full bg-[var(--theme-color)] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 hover:opacity-90 md:px-6 md:text-base">
				Next &rarr;
			</a>
		{:else}
			<span class="pointer-events-auto rounded-full bg-[var(--text-muted)] px-4 py-3 text-sm font-semibold text-white opacity-80 shadow-lg md:px-6 md:text-base">End</span>
		{/if}
	</div>
</div>

<div class="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
	<h1 class="text-2xl font-bold text-[var(--text-main)]">{book} {chapter}</h1>
	<div class="flex flex-wrap gap-2">
		<button on:click={toggleMemoryQueue} class="rounded px-4 py-2 transition-colors {isInMemoryQueue ? 'bg-purple-600 text-white' : 'bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:opacity-80'}">
			{isInMemoryQueue ? 'In Memory Queue' : 'Add to Memory Queue'}
		</button>
		<button on:click={toggleComplete} class="rounded px-4 py-2 transition-colors {isCompleted ? 'bg-green-600 text-white' : 'bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:opacity-80'}">
			{isCompleted ? 'Completed' : 'Mark Complete'}
		</button>
	</div>
</div>