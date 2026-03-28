<script>
	import { db } from '$lib/db/db';

	let query = '';
	/** @type {Array<any>} */
	let results = [];
	let isSearching = false;

	async function handleSearch() {
		if (!query) return;
		isSearching = true;
		try {
			const regex = new RegExp(query, 'i');
			results = await db.kjv_text.filter((v) => regex.test(v.text)).toArray();
		} catch (e) {
			alert('Invalid Regex');
		}
		isSearching = false;
	}
</script>

<h1 class="mb-4 text-2xl font-bold">Regex Bible Search</h1>

<div class="mb-6 flex gap-2">
	<input
		type="text"
		bind:value={query}
		placeholder="e.g. \bGod\b.*\bworld\b"
		class="flex-1 rounded border p-3 shadow-sm ring-blue-500 outline-none focus:ring-2"
		on:keydown={(e) => e.key === 'Enter' && handleSearch()}
	/>
	<button on:click={handleSearch} class="rounded bg-blue-600 px-6 py-3 font-semibold text-white">
		Search
	</button>
</div>

{#if isSearching}
	<p>Searching...</p>
{:else}
	<p class="mb-4 text-gray-500">{results.length} results found.</p>
	<div class="space-y-4">
		{#each results as res}
			<div class="rounded bg-white p-4 shadow">
				<h3 class="font-bold text-blue-600">{res.citation}</h3>
				<p class="text-gray-800">{res.text}</p>
			</div>
		{/each}
	</div>
{/if}
