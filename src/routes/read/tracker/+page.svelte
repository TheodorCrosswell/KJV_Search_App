<script>
	import { onMount } from 'svelte';
	import { db } from '$lib/db/db';
	import { getCycleStats, BIBLE_BOOKS, TOTAL_CHAPTERS } from '$lib/utils/helpers';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import HeatmapGrid from '$lib/components/HeatmapGrid.svelte';

	let heatmapData =[];
	let stats = { globalMin: 0, completedInCycle: 0 };

	onMount(async () => {
		const { globalMin, completedInCycle, progressMap } = await getCycleStats(db);
		stats = { globalMin, completedInCycle };

		const mapDict = Object.fromEntries(progressMap.map((p) =>[p.id, p.is_completed]));

		let generatedData = [];
		for (const [book, chapters] of Object.entries(BIBLE_BOOKS)) {
			for (let i = 1; i <= chapters; i++) {
				const id = `${book}_${i}`;
				const isCompleted = mapDict[id] || false;
				generatedData.push({ id, intensity: isCompleted ? 4 : 0 });
			}
		}
		heatmapData = generatedData;
	});
</script>

<h1 class="mb-4 text-2xl font-bold">Reading Progress Heatmap</h1>

<div class="mb-6 rounded bg-white p-4 shadow">
	<h2 class="mb-2 text-lg font-semibold">Cycle {stats.globalMin + 1} Progress</h2>
	<ProgressBar current={stats.completedInCycle} max={TOTAL_CHAPTERS} />
</div>

<div class="overflow-x-auto rounded bg-white p-4 shadow">
	<HeatmapGrid data={heatmapData} type="read" />
</div>