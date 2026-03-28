<script>
	export let current = 0;
	export let max = 1189;

	$: percentage = Math.round((current / max) * 100);
</script>

<div class="mb-4 h-4 w-full rounded-full bg-gray-200">
	<div
		class="h-4 rounded-full bg-blue-600 transition-all duration-500"
		style="width: {percentage}%"
	></div>
</div>
<p class="text-center text-sm text-gray-600">{current} / {max} Chapters ({percentage}%)</p>
