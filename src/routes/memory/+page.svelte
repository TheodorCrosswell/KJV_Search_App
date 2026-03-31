<script>
	import { onMount } from 'svelte';
	import { db } from '$lib/db/db';

	/** @type {Array<any>} */
	let queue = [];
	let newEntry = '';

	onMount(async () => {
		queue = await db.memory_queue.toArray();
	});

	async function addToQueue() {
		if (!newEntry) return;
		const parts = newEntry.split(' ');
		if (parts.length >= 2) {
			const book = parts.slice(0, -1).join(' ');
			const chapter = parts[parts.length - 1];
			const citation = `${book}_${chapter}`;

			await db.memory_queue.put({ citation });
			queue = await db.memory_queue.toArray();
			newEntry = '';
		}
	}
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">Memory Queue</h1>
</div>

<div class="mb-6 flex gap-2">
	<input bind:value={newEntry} placeholder="e.g. Genesis 1" class="flex-1 rounded border p-2" />
	<button on:click={addToQueue} class="rounded bg-blue-600 px-4 py-2 text-white">Add</button>
</div>

<div class="space-y-2">
	{#each queue as item}
		<a
			href="/memory/{item.citation.split('_')[0]}/{item.citation.split('_')[1]}"
			class="block rounded bg-white p-4 shadow hover:bg-gray-50"
		>
			<h2 class="text-lg font-semibold">{item.citation.replace('_', ' ')}</h2>
		</a>
	{/each}
</div>
