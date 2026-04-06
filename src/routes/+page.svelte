<script>
	import { onMount } from 'svelte';
	import { db } from '$lib/db/db';

	let continueLink = '/read';
	let continueLabel = 'Start reading';

	onMount(async () => {
		// Fetch the latest reading history (we store it with id: 1)
		const latest = await db.latest_reading.get(1);
		if (latest) {
			continueLink = `/read/${latest.book}/${latest.chapter}`;
			continueLabel = `${latest.book} ${latest.chapter}`;
		}
	});
</script>

<h1 class="mb-8 mt-4 text-center text-3xl font-extrabold text-[var(--text-main)]">KJV Bible App</h1>

<!-- 2-column, 3-row grid (total 6 items) -->
<div class="grid grid-cols-2 gap-4">
	<!-- Top Left: Continue reading -->
	<a href={continueLink} class="flex h-32 flex-col items-center justify-center rounded-xl bg-[var(--theme-color)] p-4 text-center shadow-md transition-transform active:scale-95">
		<span class="mb-1 text-lg font-bold leading-tight text-white">Continue</span>
		<span class="text-xs font-medium text-white/80">{continueLabel}</span>
	</a>

	<!-- Top Right: Memory -->
	<a href="/memory" class="flex h-32 flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center shadow-sm transition-transform hover:bg-[var(--hover-bg)] active:scale-95">
		<span class="text-lg font-bold text-[var(--text-main)]">Memory</span>
	</a>

	<!-- Middle Left: Locate -->
	<a href="/read" class="flex h-32 flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center shadow-sm transition-transform hover:bg-[var(--hover-bg)] active:scale-95">
		<span class="text-lg font-bold text-[var(--text-main)]">Locate</span>
	</a>

	<!-- Middle Right: Search -->
	<a href="/search" class="flex h-32 flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center shadow-sm transition-transform hover:bg-[var(--hover-bg)] active:scale-95">
		<span class="text-lg font-bold text-[var(--text-main)]">Search</span>
	</a>

	<!-- Bottom Left: Settings -->
	<a href="/settings" class="flex h-32 flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center shadow-sm transition-transform hover:bg-[var(--hover-bg)] active:scale-95">
		<span class="text-lg font-bold text-[var(--text-main)]">Settings</span>
	</a>

	<!-- Bottom Right: Favorite Bible verses -->
	<a href="/favorites" class="flex h-32 flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center shadow-sm transition-transform hover:bg-[var(--hover-bg)] active:scale-95">
		<span class="text-lg font-bold leading-tight text-[var(--text-main)]">Favorite<br>Verses</span>
	</a>
</div>