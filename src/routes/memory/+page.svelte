<script>
	import { onMount } from 'svelte';
	import { db } from '$lib/db/db';
	import { headerTitle, headerAction } from '$lib/stores/header';

	$: headerTitle.set('Memory Queue');
	$: headerAction.set(null);

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

<div class="mb-6 flex gap-2">
	<input bind:value={newEntry} placeholder="e.g. Genesis 1" class="flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] p-2 focus:ring-[var(--theme-color)] outline-none" />
	<button on:click={addToQueue} class="rounded bg-[var(--theme-color)] px-4 py-2 text-white hover:opacity-80 transition-opacity">Add</button>
</div>

<div class="space-y-2">
	{#each queue as item}
		<a
			href="/memory/{item.citation.split('_')[0]}/{item.citation.split('_')[1]}"
			class="block rounded bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow hover:bg-[var(--hover-bg)]"
		>
			<h2 class="text-lg font-semibold text-[var(--text-main)]">{item.citation.replace('_', ' ')}</h2>
		</a>
	{/each}
</div>