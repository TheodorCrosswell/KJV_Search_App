<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { initDB } from '$lib/db/db';
  import NavBar from '$lib/components/NavBar.svelte';
  
  let dbReady = false;

  onMount(async () => {
    await initDB(); 
    dbReady = true;
  });
</script>

{#if dbReady}
  <main class="min-h-screen relative p-4 pb-24">
    <slot />
  </main>
  <NavBar />
{:else}
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center">
      <p class="text-xl animate-pulse text-blue-600 font-semibold">Initializing KJV Bible App...</p>
      <p class="text-sm text-gray-500">This only takes a moment on first launch.</p>
    </div>
  </div>
{/if}