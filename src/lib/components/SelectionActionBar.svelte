<script>
	export let selectedCount = 0;
	export let bottomClass = "bottom-6";
	export let onClear = () => {};
</script>

{#if selectedCount > 0}
	<div class="fixed {bottomClass} left-0 right-0 z-50 mx-auto flex w-[95%] max-w-lg items-center justify-between rounded-full bg-gray-900 px-6 py-4 text-white shadow-2xl transition-transform">
		<span class="font-semibold">{selectedCount} selected</span>
		<div class="flex items-center gap-3 text-sm font-medium sm:gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
			<slot></slot>
			<div class="h-4 w-px bg-gray-600 shrink-0"></div>
			<button on:click={onClear} class="text-gray-400 transition-colors hover:text-white shrink-0" aria-label="Cancel Selection">✕</button>
		</div>
	</div>
{/if}