<script>
	import { BIBLE_BOOKS, BOOK_ABBREVIATIONS } from '$lib/utils/helpers';
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';

	const books = Object.keys(BIBLE_BOOKS);
	
	let selectedBook = null;
	let readChapters = new Set();
	
	onMount(async () => {
		const progress = await db.reading_progress.toArray();
		readChapters = new Set(progress.filter(p => p.is_completed).map(p => p.id));
	});

	// Logic to calculate percentage (0 to 100)
	$: getBookProgress = (book) => {
		const total = BIBLE_BOOKS[book];
		let completedCount = 0;
		for (let i = 1; i <= total; i++) {
			if (readChapters.has(`${book}_${i}`)) {
				completedCount++;
			}
		}
		return (completedCount / total) * 100;
	};
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">Read the Bible</h1>
</div>

{#if !selectedBook}
	<!-- Book Grid (6 wide, 11 vertical = 66 books) -->
	<div class="grid grid-cols-6 gap-2">
		{#each books as book}
			{@const percent = getBookProgress(book)}
			<button 
				class="flex aspect-square flex-col items-center justify-center rounded p-1 shadow transition-colors md:p-2 {percent > 50 ? 'text-white' : 'text-gray-900'}"
				style="background-color: color-mix(in srgb, #22c55e {percent}%, white);"
				on:click={() => selectedBook = book}
			>
				<span class="text-lg font-bold leading-none md:text-xl">{BOOK_ABBREVIATIONS[book]}</span>
				<span class="mt-1 w-full truncate text-center text-[0.55rem] leading-tight md:text-xs">{book}</span>
			</button>
		{/each}
	</div>
{:else}
	<!-- Chapter Grid -->
	<div class="mb-4">
		<button class="flex items-center text-blue-600 underline" on:click={() => selectedBook = null}>
			&larr; Back to Books
		</button>
	</div>
	
	<h2 class="mb-4 text-2xl font-bold">{selectedBook}</h2>
	
	<div class="grid grid-cols-6 gap-2">
		{#each Array(BIBLE_BOOKS[selectedBook]) as _, i}
			{@const chapNum = i + 1}
			{@const isRead = readChapters.has(`${selectedBook}_${chapNum}`)}
			<a 
				href="/read/{selectedBook}/{chapNum}"
				class="flex aspect-square items-center justify-center rounded text-lg font-bold shadow transition-colors md:text-xl {isRead ? 'bg-green-500 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'}"
			>
				{chapNum}
			</a>
		{/each}
	</div>
{/if}