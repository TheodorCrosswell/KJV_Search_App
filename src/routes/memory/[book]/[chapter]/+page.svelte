<script>
	import { page } from '$app/stores';
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';

	$: book = $page.params.book;
	$: chapter = parseInt($page.params.chapter);

	/** @type {Array<any>} */
	let verses = [];

	/** @type {Record<string, number>} */
	let progressMap = {};

	async function loadVerses() {
		verses = await db.kjv_text.where({ book, chapter }).toArray();
		verses.sort((a, b) => a.verse - b.verse);

		const citation = `${book}_${chapter}`;
		const memProgress = await db.memory_progress.where({ citation }).toArray();

		progressMap = Object.fromEntries(memProgress.map((p) => [p.id, p.current_level]));
	}

	$: if (book && chapter) loadVerses();
</script>

<h1 class="mb-6 text-2xl font-bold text-[var(--text-main)]">{book} {chapter} - Verses</h1>

<div class="space-y-3">
	{#each verses as v}
		{@const level = progressMap[`${book}_${chapter}_${v.verse}`] || 0}
		<a
			href="/memory/{book}/{chapter}/{v.verse}"
			class="block rounded border border-[var(--border-color)] border-l-4 p-4 shadow transition-colors {level === 4
				? 'bg-green-500/10 hover:bg-green-500/20'
				: 'bg-[var(--bg-card)] hover:bg-[var(--hover-bg)]'}"
			style="border-left-color: {level === 4 ? '#22c55e' : 'var(--theme-color)'};"
		>
			<div class="flex justify-between">
				<span class="font-bold text-[var(--text-main)]">Verse {v.verse}</span>
				<span class="text-sm font-semibold text-[var(--text-muted)]">Level: {level}/4</span>
			</div>
			<p class="mt-2 truncate text-[var(--text-main)] opacity-90">{v.text}</p>
		</a>
	{/each}
</div>