<script>
	import { BIBLE_BOOKS, BOOK_ABBREVIATIONS } from '$lib/utils/helpers';
	import { db } from '$lib/db/db';
	import { onMount } from 'svelte';

	const books = Object.keys(BIBLE_BOOKS);
	
	/** @type {string | null} */
	let selectedBook = null;
	
	/** @type {Set<string>} */
	let readChapters = new Set();
	
	onMount(async () => {
		const progress = await db.reading_progress.toArray();
		readChapters = new Set(progress.filter((/** @type {any} */ p) => p.is_completed).map((/** @type {any} */ p) => p.id));
	});

	$: getBookProgress = (/** @type {string} */ book) => {
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

{#if !selectedBook}
	<!-- Book Grid: dynamically 6x11 in portrait and 11x6 in landscape -->
	<div 
		class="grid portrait:grid-cols-6 portrait:grid-rows-[11] landscape:grid-cols-11 landscape:grid-rows-6 gap-1 md:gap-2 w-full"
		style="height: calc(100dvh - 140px);"
	>
		{#each books as book}
			{@const percent = getBookProgress(book)}
			<!-- Removed aspect-square, added w-full h-full so they stretch and fit flawlessly -->
			<button 
				class="flex h-full w-full flex-col items-center justify-center rounded p-0.5 md:p-1 shadow-sm transition-colors overflow-hidden {percent > 50 ? 'text-white' : 'text-gray-900'}"
				style="background-color: color-mix(in srgb, #22c55e {percent}%, white);"
				on:click={() => selectedBook = book}
			>
				<span class="text-[0.65rem] sm:text-xs md:text-base lg:text-lg font-bold leading-none">{BOOK_ABBREVIATIONS[book]}</span>
				<span class="mt-0.5 sm:mt-1 w-full truncate text-center text-[0.45rem] sm:text-[0.55rem] md:text-xs leading-tight opacity-90">{book}</span>
			</button>
		{/each}
	</div>
{:else}
	<!-- Chapter Selection -->
	
	<h2 class="mb-4 text-2xl font-bold">{selectedBook}</h2>
	
	<!-- Using 4 cols on mobile to ensure buttons are huge and easily tappable, up to 10 on desktop -->
	<div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3 pb-8">
		{#each Array(BIBLE_BOOKS[selectedBook]) as _, i}
			{@const chapNum = i + 1}
			{@const isRead = readChapters.has(`${selectedBook}_${chapNum}`)}
			<a 
				href="/read/{selectedBook}/{chapNum}"
				class="flex aspect-square min-h-[56px] items-center justify-center rounded-lg text-xl font-bold shadow transition-colors md:text-xl {isRead ? 'bg-green-500 text-white' : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'}"
			>
				{chapNum}
			</a>
		{/each}
	</div>
{/if}