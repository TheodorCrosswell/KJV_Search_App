<script>
	import { page } from '$app/stores';
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';
	import { BIBLE_BOOKS } from '$lib/utils/helpers';

	$: book = $page.params.book;
	$: chapter = parseInt($page.params.chapter);

	let verses = [];
	let isCompleted = false;

	$: maxChapter = BIBLE_BOOKS[book] || 1;

	async function loadChapter() {
		verses = await db.kjv_text.where({ book, chapter }).toArray();
		verses.sort((a, b) => a.verse - b.verse);

		const progressId = `${book}_${chapter}`;
		const progress = await db.reading_progress.get(progressId);
		// Simple heuristic: if read today, show completed (in real app, use timestamp logic)
		isCompleted = !!progress;
	}

	$: if (book && chapter) loadChapter();

	async function toggleComplete() {
		const progressId = `${book}_${chapter}`;
		const current = await db.reading_progress.get(progressId);

		if (!isCompleted) {
			await db.reading_progress.put({
				id: progressId,
				completion_date: Date.now(),
				completion_counts: (current?.completion_counts || 0) + 1
			});
			isCompleted = true;
		}
	}
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">{book} {chapter}</h1>
	<button
		on:click={toggleComplete}
		class="rounded px-4 py-2 {isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'}"
	>
		{isCompleted ? 'Completed' : 'Mark Complete'}
	</button>
</div>

<div class="mb-6 space-y-3 rounded bg-white p-6 shadow">
	{#if verses.length === 0}
		<p>Loading verses...</p>
	{/if}
	{#each verses as v}
		<p class="text-lg"><sup class="mr-1 text-xs font-bold">{v.verse}</sup>{v.text}</p>
	{/each}
</div>

<div class="flex justify-between">
	{#if chapter > 1}
		<a href="/read/{book}/{chapter - 1}" class="rounded bg-blue-600 px-4 py-2 text-white"
			>Previous</a
		>
	{:else}
		<div></div>
	{/if}

	{#if chapter < maxChapter}
		<a href="/read/{book}/{chapter + 1}" class="rounded bg-blue-600 px-4 py-2 text-white">Next</a>
	{:else}
		<span class="px-4 py-2 text-gray-400">End of Book</span>
	{/if}
</div>
