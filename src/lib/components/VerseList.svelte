<script>
	/** @type {Array<any>} */
	export let verses = [];
	/** @type {Set<any>} */
	export let selected;
	/** @type {Function} */
	export let handleLongPress = () => {};
	/** @type {Function} */
	export let handleClick;
	/** @type {string} */
	export let fallbackMessage = "Loading verses...";

	// Reference the prop so the Svelte compiler doesn't throw an 'unused-export-let' warning.
	// We intentionally aren't binding it in the HTML to prevent long-press selection on this screen.
	$: typeof handleLongPress;
</script>

<div class="space-y-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow sm:p-6 portrait:-mx-4 portrait:rounded-none portrait:border-x-0 portrait:px-2">
	{#if verses.length === 0}
		<p class="text-[var(--text-main)]">{fallbackMessage}</p>
	{/if}
	{#each verses as v}
		<div
			id="verse-{v.id}"
			role="button"
			tabindex="0"
			class="group flex cursor-pointer select-none items-start gap-3 rounded -mx-2 p-2 transition-colors {selected.has(v.id) ? 'bg-[var(--theme-light)]' : 'hover:bg-[var(--hover-bg)]'}"
			on:click={() => handleClick(v.id, () => {}, true)}
			on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(v.id, () => {}, true)}
		>
			<slot verse={v}>
				<!-- Default Read Layout Fallback -->
				<p class="flex-1 text-lg text-[var(--text-main)]"><sup class="mr-1 text-xs font-bold">{v.verse}</sup>{v.text}</p>
			</slot>
		</div>
	{/each}
</div>