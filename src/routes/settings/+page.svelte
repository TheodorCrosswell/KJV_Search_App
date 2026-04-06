<script>
	// Import your global stores directly
	import { headerTitle, headerAction } from '$lib/stores/header';
	import { themeColor, isDarkMode } from '$lib/stores/theme';

	$: headerTitle.set('Settings');
	$: headerAction.set(null);
	
	let isUpdating = false;

	async function updateApp() {
		isUpdating = true;
		try {
			if ('caches' in window) {
				const cacheNames = await caches.keys();
				await Promise.all(cacheNames.map(name => caches.delete(name)));
			}

			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				for (const reg of registrations) {
					await reg.unregister();
				}
			}

			window.location.reload();
		} catch (error) {
			console.error('Failed to update app:', error);
			alert('Update failed. Please check your internet connection and try again.');
			isUpdating = false;
		}
	}
</script>

<div class="space-y-4">
	<!-- Theme Color -->
	<div class="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium text-[var(--text-main)]">Theme Color</span>
			<div class="flex items-center gap-2">
				<input type="color" bind:value={$themeColor} class="h-8 w-14 cursor-pointer rounded border-0 p-0 bg-transparent" />
			</div>
		</div>
	</div>

	<!-- Dark Mode -->
	<div class="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium text-[var(--text-main)]">Dark Mode</span>
			<input type="checkbox" bind:checked={$isDarkMode} class="h-5 w-5 rounded border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--theme-color)] focus:ring-[var(--theme-color)]" />
		</div>
	</div>

	<!-- App Version / Force Update -->
	<div class="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium text-[var(--text-main)]">App Version</span>
			<button 
				class="rounded-md bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 transition-opacity disabled:opacity-50"
				on:click={updateApp}
				disabled={isUpdating}
			>
				{isUpdating ? 'Updating...' : 'Force Update App'}
			</button>
		</div>
		<p class="mt-2 text-xs text-[var(--text-muted)]">
			Downloads the latest version of the app. Your reading progress and saved data will not be lost.
		</p>
	</div>
</div>