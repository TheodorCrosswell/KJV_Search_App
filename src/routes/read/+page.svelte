<script>
	import { BIBLE_BOOKS } from '$lib/utils/helpers';
	const books = Object.keys(BIBLE_BOOKS);
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">Read the Bible</h1>
	<a href="/read/tracker" class="text-blue-600 underline">View Heatmap Tracker</a>
</div>

<div class="grid gap-2">
	{#each books as book}
		<details class="rounded bg-white p-4 shadow">
			<summary class="cursor-pointer text-lg font-semibold">{book}</summary>
			<div class="mt-4 grid grid-cols-5 gap-2">
				{#each Array(BIBLE_BOOKS[book]) as _, i}
					<a
						href="/read/{book}/{i + 1}"
						class="rounded bg-gray-100 p-2 text-center hover:bg-blue-100"
					>
						{i + 1}
					</a>
				{/each}
			</div>
		</details>
	{/each}
</div>
