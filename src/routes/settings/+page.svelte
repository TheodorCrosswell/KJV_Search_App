<script>
	
	import { headerTitle, headerAction } from '$lib/stores/header';

	$: headerTitle.set('Settings');
	$: headerAction.set(null);
	
	let isUpdating = false;

	async function updateApp() {
		isUpdating = true;
		try {
			// 1. Delete all PWA caches (HTML, CSS, JS)
			if ('caches' in window) {
				const cacheNames = await caches.keys();
				await Promise.all(cacheNames.map(name => caches.delete(name)));
			}

			// 2. Unregister all Service Workers
			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				for (const reg of registrations) {
					await reg.unregister();
				}
			}

			// 3. Reload the page to fetch the newest version directly from the network
			window.location.reload();
		} catch (error) {
			console.error('Failed to update app:', error);
			alert('Update failed. Please check your internet connection and try again.');
			isUpdating = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="rounded-lg bg-white p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium">Dark Mode</span>
			<input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-blue-600" />
		</div>
	</div>
	
	<div class="rounded-lg bg-white p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium">Reading Font Size</span>
			<input type="range" min="14" max="32" value="18" class="w-1/2" />
		</div>
	</div>
	
	<div class="rounded-lg bg-white p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium">Red Letter Words</span>
			<input type="checkbox" checked class="h-5 w-5 rounded border-gray-300 text-blue-600" />
		</div>
	</div>

	<!-- New Update App Section -->
	<div class="rounded-lg bg-white p-4 shadow">
		<div class="flex items-center justify-between">
			<span class="font-medium">App Version</span>
			<button 
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
				on:click={updateApp}
				disabled={isUpdating}
			>
				{isUpdating ? 'Updating...' : 'Force Update App'}
			</button>
		</div>
		<p class="mt-2 text-xs text-gray-500">
			Downloads the latest version of the app. Your reading progress and saved data will not be lost.
		</p>
	</div>
</div>