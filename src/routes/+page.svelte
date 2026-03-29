<script>
	import { onMount } from 'svelte';
	import { db } from '$lib/db/db';

	let readingCount = 0;
	let memoryQueueCount = 0;

	onMount(async () => {
		const progress = await db.reading_progress.toArray();
		readingCount = progress.filter(p => p.is_completed).length; // Map to the boolean length instead of raw entries count
		memoryQueueCount = await db.memory_queue.count();
	});
</script>

<!-- (The rest of the file stays exactly identical to original) -->
<h1 class="mb-6 text-3xl font-bold">Dashboard</h1>

<div class="grid gap-4">
	<a href="/read" class="rounded-lg border border-gray-100 bg-white p-6 shadow">
		<h2 class="mb-2 text-xl font-semibold">Bible Reading</h2>
		<p class="text-gray-600">{readingCount}/1189 Chapters Read</p>
	</a>

	<a href="/search" class="rounded-lg border border-gray-100 bg-white p-6 shadow">
		<h2 class="mb-2 text-xl font-semibold">Search</h2>
		<p class="text-gray-600">Regex offline search engine</p>
	</a>

	<a href="/memory" class="rounded-lg border border-gray-100 bg-white p-6 shadow">
		<h2 class="mb-2 text-xl font-semibold">Memory Practice</h2>
		<p class="text-gray-600">{memoryQueueCount} Chapters in queue</p>
	</a>
</div>