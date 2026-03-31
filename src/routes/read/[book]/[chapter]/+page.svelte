<script>
	import { page } from '$app/stores';
	import { db } from '$lib/db/db';
	import { BIBLE_BOOKS, TOTAL_CHAPTERS } from '$lib/utils/helpers';

	$: book = $page.params.book;
	$: chapter = parseInt($page.params.chapter);

	let verses = [];
	let isCompleted = false;
	let favoriteIds = new Set(); // To color favorite hearts

	$: maxChapter = BIBLE_BOOKS[book] || 1;

	async function loadChapter() {
		verses = []; // Briefly clear verses to give visual refresh mapping
		verses = await db.kjv_text.where({ book, chapter }).toArray();
		verses.sort((a, b) => a.verse - b.verse);

		const progressId = `${book}_${chapter}`;
		const progress = await db.reading_progress.get(progressId);
		isCompleted = progress?.is_completed || false;

		// Save to latest reading!
		await db.latest_reading.put({ id: 1, book, chapter });

		// Fetch favorites for styling
		const favs = await db.favorite_verses.toArray();
		favoriteIds = new Set(favs.map(f => f.id));
	}

	$: if (book && chapter) loadChapter();

	async function toggleComplete() {
		const progressId = `${book}_${chapter}`;
		
		if (!isCompleted) {
			await db.reading_progress.put({ id: progressId, completion_date: Date.now(), is_completed: true });
			isCompleted = true;
			
			const allProgress = await db.reading_progress.toArray();
			const completedCount = allProgress.filter(p => p.is_completed).length;
			
			if (completedCount >= TOTAL_CHAPTERS) {
				const confirmReset = confirm("Congratulations! You have read the entire Bible! Do you want to increment your completion count and reset your progress?");
				if (confirmReset) {
					const countsRecord = await db.metadata.get('completion_counts');
					const counts = countsRecord ? countsRecord.value : 0;
					await db.metadata.put({ key: 'completion_counts', value: counts + 1 });
					
					const updatedProgress = allProgress.map(p => ({ ...p, is_completed: false }));
					await db.reading_progress.bulkPut(updatedProgress);
					isCompleted = false;
				}
			}
		} else {
			await db.reading_progress.put({ id: progressId, completion_date: Date.now(), is_completed: false });
			isCompleted = false;
		}
	}

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
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">{book} {chapter}</h1>
	<button
		on:click={toggleComplete}
		class="rounded px-4 py-2 transition-colors {isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-900'}"
	>
		{isCompleted ? 'Completed' : 'Mark Complete'}
	</button>
</div>

<div class="space-y-3 rounded bg-white p-6 shadow">
	{#if verses.length === 0}
		<p>Loading verses...</p>
	{/if}
	{#each verses as v}
		<div class="flex items-start gap-3 group">
			<p class="text-lg flex-1"><sup class="mr-1 text-xs font-bold">{v.verse}</sup>{v.text}</p>
			<!-- Favorite Toggle Button -->
			<button 
				on:click={() => toggleFavorite(v)}
				class="mt-1 text-2xl transition-colors {favoriteIds.has(v.id) ? 'text-red-500' : 'text-gray-200 hover:text-red-300'}"
			>
				♥
			</button>
		</div>
	{/each}
</div>
<!-- Extra height pushing the final verses safely above the floating absolute controls -->
<div class="h-24"></div>

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