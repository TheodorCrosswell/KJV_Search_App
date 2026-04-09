<script>
	import { onMount } from 'svelte';
	import { headerTitle, headerAction } from '$lib/stores/header';
	import { themeColor, isDarkMode } from '$lib/stores/theme';
	import { supabase, syncData } from '$lib/db/supabase';

	$: headerTitle.set('Settings');
	$: headerAction.set(null);
	
	let isUpdating = false;

	// Auth & Sync State
	/** @type {any} */
	let user = null;
	let showAuthForm = false;
	let authEmail = '';
	let authPassword = '';
	let isAuthLoading = false;
	let authError = '';
	let isSyncing = false;
	let isSupabaseConfigured = !!supabase;

	onMount(async () => {
		if (supabase) {
			const { data } = await supabase.auth.getSession();
			user = data?.session?.user || null;

			supabase.auth.onAuthStateChange((event, session) => {
				user = session?.user || null;
			});
		}
	});

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

	async function handleLogin() {
		if (!supabase) return;
		isAuthLoading = true;
		authError = '';
		const { data, error } = await supabase.auth.signInWithPassword({
			email: authEmail,
			password: authPassword
		});
		
		if (error) {
			authError = error.message;
		} else if (data.user) {
			showAuthForm = false;
			await performSync(data.user.id);
		}
		isAuthLoading = false;
	}

	async function handleSignup() {
		if (!supabase) return;
		isAuthLoading = true;
		authError = '';
		const { data, error } = await supabase.auth.signUp({
			email: authEmail,
			password: authPassword
		});
		
		if (error) {
			authError = error.message;
		} else if (data.user) {
			showAuthForm = false;
			alert("Account created! Uploading local progress...");
			await performSync(data.user.id);
		}
		isAuthLoading = false;
	}

	async function handleLogout() {
		if (!supabase) return;
		await supabase.auth.signOut();
	}

	/** @param {string} userId */
	async function performSync(userId) {
		isSyncing = true;
		try {
			await syncData(userId);
		} catch (err) {
			console.error("Sync failed", err);
			alert("Sync failed. Check your connection.");
		}
		isSyncing = false;
	}
</script>

<div class="space-y-4">
	
	<!-- Cloud Sync -->
	<div class="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow">
		<div class="flex items-center justify-between mb-3">
			<span class="font-medium text-[var(--text-main)]">Cloud Sync</span>
		</div>
		
		{#if isSupabaseConfigured}
			{#if user}
				<div class="text-sm text-[var(--text-main)] mb-4">
					Logged in as <span class="font-semibold">{user.email}</span>
				</div>
				<div class="flex gap-2">
					<button 
						on:click={() => performSync(user.id)} 
						disabled={isSyncing} 
						class="rounded-md bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 transition-opacity disabled:opacity-50"
					>
						{isSyncing ? 'Syncing...' : 'Sync Now'}
					</button>
					<button 
						on:click={handleLogout} 
						class="rounded-md bg-transparent border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm hover:opacity-80 transition-opacity"
					>
						Logout
					</button>
				</div>
			{:else}
				{#if showAuthForm}
					<div class="space-y-3 mt-2">
						<input type="email" bind:value={authEmail} placeholder="Email" class="w-full rounded border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-sm text-[var(--text-main)] focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)]" />
						<input type="password" bind:value={authPassword} placeholder="Password" class="w-full rounded border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-sm text-[var(--text-main)] focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)]" />
						
						<div class="flex gap-2 pt-2">
							<button on:click={handleLogin} disabled={isAuthLoading} class="rounded-md bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 transition-opacity disabled:opacity-50 flex-1">
								Login
							</button>
							<button on:click={handleSignup} disabled={isAuthLoading} class="rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm hover:opacity-80 transition-opacity disabled:opacity-50 flex-1">
								Create Account
							</button>
						</div>
						
						<button on:click={() => showAuthForm = false} class="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] mt-2">
							Cancel
						</button>
						
						{#if authError}
							<p class="text-red-500 text-xs mt-2">{authError}</p>
						{/if}
					</div>
				{:else}
					<p class="text-xs text-[var(--text-muted)] mb-3">
						Create an account to backup your reading progress, memory queue, and settings across devices. Your local data will be imported automatically.
					</p>
					<button 
						on:click={() => showAuthForm = true} 
						class="rounded-md bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 transition-opacity"
					>
						Login to sync data
					</button>
				{/if}
			{/if}
		{:else} <!-- THIS LINE WAS FIXED from {#else} to {:else} -->
			<p class="text-xs text-[var(--text-muted)]">Supabase sync is not configured. Setup environment variables to enable.</p>
		{/if}
	</div>

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
				class="rounded-md bg-transparent border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm hover:opacity-80 transition-opacity disabled:opacity-50"
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