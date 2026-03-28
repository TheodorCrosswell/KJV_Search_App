<script>
	import { onMount } from 'svelte';
	import { db } from '$lib/db/db';
	import HeatmapGrid from '$lib/components/HeatmapGrid.svelte';

	/** @type {Array<{id: string, intensity: number}>} */
	let heatmapData = [];

	onMount(async () => {
		const queue = await db.memory_queue.toArray();
		let generatedData = [];

		for (const item of queue) {
			const citation = item.citation;
			const [book, chapterStr] = citation.split('_');
			const chapter = parseInt(chapterStr);

			const verses = await db.kjv_text.where({ book, chapter }).toArray();
			const totalVerses = verses.length;

			const progress = await db.memory_progress.where({ citation }).toArray();
			const fullyMemorized = progress.filter((p) => p.current_level === 4).length;

			const intensity = totalVerses === 0 ? 0 : Math.round((fullyMemorized / totalVerses) * 100);

			generatedData.push({ id: citation, intensity });
		}
		heatmapData = generatedData;
	});
</script>

<h1 class="mb-6 text-2xl font-bold">Memory Progress Heatmap</h1>

<div class="rounded bg-white p-6 shadow">
	{#if heatmapData.length === 0}
		<p>No chapters in memory queue.</p>
	{:else}
		<HeatmapGrid data={heatmapData} type="memory" />
	{/if}
</div>
