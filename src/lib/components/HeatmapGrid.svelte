<script>
	/** @type {Array<{id: string, intensity: number}>} */
	export let data = [];
	export let type = 'read'; // 'read' or 'memory'

	/** @param {number} intensity */
	function getColor(intensity) {
		if (type === 'read') {
			const colors = [
				'bg-gray-100',
				'bg-green-200',
				'bg-green-400',
				'bg-green-600',
				'bg-green-800'
			];
			return colors[Math.min(intensity, 4)];
		} else {
			// Memory uses 0-100 percentages
			if (intensity === 0) return 'bg-gray-100';
			if (intensity < 30) return 'bg-blue-200';
			if (intensity < 70) return 'bg-blue-400';
			if (intensity < 100) return 'bg-blue-600';
			return 'bg-blue-800';
		}
	}
</script>

<div class="grid grid-cols-10 gap-1 sm:grid-cols-15 md:grid-cols-20">
	{#each data as item}
		<div
			class="h-6 w-6 rounded-sm {getColor(item.intensity)}"
			title="{item.id} - Intensity: {item.intensity}"
		></div>
	{/each}
</div>
