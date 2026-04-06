<script>
	import { page } from '$app/stores';
	import { db } from '$lib/db/db';
	import MemoryTyper from '$lib/components/MemoryTyper.svelte';

	$: book = $page.params.book;
	$: chapter = parseInt($page.params.chapter);
	$: verse = parseInt($page.params.verse);

	let text = '';
	let currentLevel = 0;
	let statusMessage = '';

	$: id = `${book}_${chapter}_${verse}`;
	$: citation = `${book}_${chapter}`;

	async function loadData() {
		const v = await db.kjv_text.where({ book, chapter, verse }).first();
		if (v) text = v.text;

		const prog = await db.memory_progress.get(id);
		currentLevel = prog ? prog.current_level : 1;
		if (currentLevel === 0) currentLevel = 1; // start at level 1
	}

	$: if (book && chapter && verse) loadData();
	
	/** @param {number} accuracy */
	async function handleFinish(accuracy) {
		if (accuracy >= 0.9) {
			currentLevel = Math.min(currentLevel + 1, 4);
			statusMessage = `Passed! Accuracy: ${(accuracy * 100).toFixed(1)}%. Advancing to level ${currentLevel}.`;

			await db.memory_progress.put({
				id,
				citation,
				current_level: currentLevel,
				last_practiced_at: Date.now()
			});
		} else {
			statusMessage = `Failed. Accuracy: ${(accuracy * 100).toFixed(1)}%. Must be >= 90%. Try again.`;
		}
	}

	function retry() {
		statusMessage = '';
		// Re-mount component trick
		text = text;
	}
</script>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-[var(--text-main)]">{book} {chapter}:{verse}</h1>
	<p class="mt-1 text-[var(--text-muted)]">Current Level: {currentLevel} / 4</p>
</div>

<div class="min-h-[200px] rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow">
	{#if statusMessage}
		<div class="text-center">
			<p
				class="mb-4 text-xl font-semibold {statusMessage.includes('Passed')
					? 'text-green-500'
					: 'text-red-500'}"
			>
				{statusMessage}
			</p>
			<button on:click={retry} class="rounded bg-[var(--theme-color)] px-6 py-2 text-white hover:opacity-80 transition-opacity">Continue</button>
			<a href="/memory/{book}/{chapter}" class="ml-2 rounded border border-[var(--border-color)] bg-[var(--hover-bg)] px-6 py-2 text-[var(--text-main)] hover:opacity-80 transition-opacity"
				>Back to Chapter</a
			>
		</div>
	{:else if text && currentLevel < 4}
		<MemoryTyper {text} level={currentLevel} onFinish={handleFinish} />
	{:else if currentLevel === 4}
		<div class="py-10 text-center">
			<span class="text-4xl">🎉</span>
			<h2 class="mt-4 text-2xl font-bold text-green-500">Fully Memorized!</h2>
			<button
				on:click={() => {
					currentLevel = 3;
					retry();
				}}
				class="mt-4 rounded border border-[var(--border-color)] bg-[var(--hover-bg)] px-4 py-2 text-[var(--text-main)] hover:opacity-80 transition-opacity">Practice Again (Level 3)</button
			>
		</div>
	{/if}
</div>
<p class="mt-4 text-sm text-[var(--text-muted)] opacity-80">
	Type the first letter of each word to practice. Punctuation is ignored.
</p>