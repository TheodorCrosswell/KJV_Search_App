<script>
	import { longpress } from '$lib/utils/helpers';

	/** @type {Array<any>} */
	export let verses = [];
	/** @type {Set<any>} */
	export let selected;
	/** @type {Function} */
	export let handleLongPress;
	/** @type {Function} */
	export let handleClick;
	/** @type {string} */
	export let fallbackMessage = "Loading verses...";
</script>

<div class="space-y-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow sm:p-6 portrait:-mx-4 portrait:rounded-none portrait:border-x-0 portrait:px-2">
	{#if verses.length === 0}
		<p class="text-[var(--text-main)]">{fallbackMessage}</p>
	{/if}
	{#each verses as v}
		<div
			role="button"
			tabindex="0"
			class="flex cursor-pointer select-none items-start gap-3 rounded p-2 -mx-2 transition-colors group {selected.has(v.id) ? 'bg-[var(--theme-light)]' : 'hover:bg-[var(--hover-bg)]'}"
			use:longpress
			on:longpress={() => handleLongPress(v.id)}
			on:click={() => handleClick(v.id, () => {})}
			on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(v.id, () => {})}
		>
			<slot verse={v}>
				<!-- Default Read Layout Fallback -->
				<p class="flex-1 text-lg text-[var(--text-main)]"><sup class="mr-1 text-xs font-bold">{v.verse}</sup>{v.text}</p>
			</slot>
		</div>
	{/each}
</div>