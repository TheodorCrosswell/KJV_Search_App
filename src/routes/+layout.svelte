<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { dev } from '$app/environment'; /* <--- Add this import */
  import { initDB } from '$lib/db/db';
  import NavBar from '$lib/components/NavBar.svelte';
  
  let dbReady = false;

  onMount(async () => {
    // Only register the service worker if NOT in dev mode
    if (!dev && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
    
    await initDB();
    dbReady = true;
  });
</script>

<!-- The rest of your HTML stays the same -->
{#if dbReady}
  <main class="min-h-screen relative p-4 pb-24">
    <slot />
  </main>
  <NavBar />
{:else}
  <div class="flex items-center justify-center min-h-screen">
    <p class="text-xl animate-pulse">Initializing Bible Data...</p>
  </div>
{/if}