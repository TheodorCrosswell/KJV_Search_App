<script>
	import { page } from '$app/stores';
	import { db } from '$lib/db/db';
	import { BIBLE_BOOKS, TOTAL_CHAPTERS } from '$lib/utils/helpers';

	$: book = $page.params.book;
	$: chapter = parseInt($page.params.chapter);

	let verses =[];
	let isCompleted = false;

	$: maxChapter = BIBLE_BOOKS[book] || 1;

	async function loadChapter() {
        verses =[]; // Briefly clear verses to give visual refresh mapping
		verses = await db.kjv_text.where({ book, chapter }).toArray();
		verses.sort((a, b) => a.verse - b.verse);

		const progressId = `${book}_${chapter}`;
		const progress = await db.reading_progress.get(progressId);
		isCompleted = progress?.is_completed || false;
	}

	$: if (book && chapter) loadChapter();

	async function toggleComplete() {
		const progressId = `${book}_${chapter}`;
		
		if (!isCompleted) {
			await db.reading_progress.put({
				id: progressId,
				completion_date: Date.now(),
				is_completed: true
			});
			isCompleted = true;
			
			const allProgress = await db.reading_progress.toArray();
			const completedCount = allProgress.filter(p => p.is_completed).length;
			
			// Detect when the entire Bible has been completed
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
            // Allows unchecking if marked complete by accident
			await db.reading_progress.put({
				id: progressId,
				completion_date: Date.now(),
				is_completed: false
			});
			isCompleted = false;
		}
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
		<p class="text-lg"><sup class="mr-1 text-xs font-bold">{v.verse}</sup>{v.text}</p>
	{/each}
</div>

<!-- Extra height pushing the final verses safely above the floating absolute controls -->
<div class="h-24"></div>

<div class="fixed bottom-20 left-0 right-0 z-40 mx-auto flex w-full max-w-4xl justify-between px-4 pointer-events-none">
	{#if chapter > 1}
		<a href="/read/{book}/{chapter - 1}" class="pointer-events-auto rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform active:scale-95">
			&larr; Prev
		</a>
	{:else}
		<div></div>
	{/if}

	{#if chapter < maxChapter}
		<a href="/read/{book}/{chapter + 1}" class="pointer-events-auto rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform active:scale-95">
			Next &rarr;
		</a>
	{:else}
		<span class="pointer-events-auto rounded-full bg-gray-500 px-6 py-3 font-semibold text-white shadow-lg opacity-80">End of Book</span>
	{/if}
</div>