<script>
	import { page } from '$app/stores';
	import { db } from '$lib/db/db';
	import { BIBLE_BOOKS, TOTAL_CHAPTERS, createSelectionManager, longpress } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';

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
	}

	$: if (book && chapter) loadChapter();

	async function toggleComplete() {
		// Existing logic...
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
		const sortedVerses = verses.filter(v => $selected.has(v.id));
		const textToCopy = sortedVerses.map(v => `${v.citation} ${v.text}`).join('\n');
		
		try {
			await navigator.clipboard.writeText(textToCopy);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
		clear();
	}

	async function favoriteSelected() {
		const sortedVerses = verses.filter(v => $selected.has(v.id));
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
</script>

<div class="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
	<h1 class="text-2xl font-bold">{book} {chapter}</h1>
	<div class="flex flex-wrap gap-2">
		<button on:click={toggleMemoryQueue} class="rounded px-4 py-2 transition-colors {isInMemoryQueue ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}">
			{isInMemoryQueue ? 'In Memory Queue' : 'Add to Queue'}
		</button>
		<button on:click={toggleComplete} class="rounded px-4 py-2 transition-colors {isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}">
			{isCompleted ? 'Completed' : 'Mark Complete'}
		</button>
	</div>
</div>

<div class="space-y-1 rounded bg-white p-4 shadow sm:p-6">
	{#if verses.length === 0}
		<p>Loading verses...</p>
	{/if}
	{#each verses as v}
		<div
			role="button"
			tabindex="0"
			class="flex cursor-pointer select-none items-start gap-3 rounded p-2 -mx-2 transition-colors group {$selected.has(v.id) ? 'bg-blue-100' : 'hover:bg-gray-50'}"
			use:longpress
			on:longpress={() => handleLongPress(v.id)}
			on:click={() => handleClick(v.id, () => {})}
			on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(v.id, () => {})}
		>
			<p class="flex-1 text-lg"><sup class="mr-1 text-xs font-bold">{v.verse}</sup>{v.text}</p>
			
			<button 
				on:click|stopPropagation={() => toggleFavorite(v)}
				class="mt-1 text-2xl transition-colors {favoriteIds.has(v.id) ? 'text-red-500' : 'text-gray-200 hover:text-red-300'}"
				aria-label="Toggle Favorite"
			>
				♥
			</button>
		</div>
	{/each}
</div>

<div class="h-32"></div>

<SelectionActionBar selectedCount={$selected.size} bottomClass="bottom-24" onClear={clear}>
	<button on:click={copySelected} class="transition-colors hover:text-blue-300">Copy</button>
	<button on:click={favoriteSelected} class="transition-colors hover:text-red-300">Favorite</button>
</SelectionActionBar>

<div class="pointer-events-none fixed bottom-6 left-0 right-0 z-40 mx-auto flex w-full max-w-4xl justify-between gap-2 px-4">
	<!-- Left Side: Prev -->
	<div class="flex flex-1 justify-start">
		{#if chapter > 1}
			<a href="/read/{book}/{chapter - 1}" class="pointer-events-auto rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 md:px-6 md:text-base">
				&larr; Prev
			</a>
		{/if}
	</div>

	<!-- Center: Locate -->
	<div class="flex flex-1 justify-center">
		<a href="/read" class="pointer-events-auto flex items-center justify-center rounded-full bg-gray-800 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 md:px-6 md:text-base">
			Locate
		</a>
	</div>

	<!-- Right Side: Next -->
	<div class="flex flex-1 justify-end">
		{#if chapter < maxChapter}
			<a href="/read/{book}/{chapter + 1}" class="pointer-events-auto rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 md:px-6 md:text-base">
				Next &rarr;
			</a>
		{:else}
			<span class="pointer-events-auto rounded-full bg-gray-500 px-4 py-3 text-sm font-semibold text-white opacity-80 shadow-lg md:px-6 md:text-base">End</span>
		{/if}
	</div>
</div>