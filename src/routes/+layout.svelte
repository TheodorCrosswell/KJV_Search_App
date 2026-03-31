<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { initDB } from '$lib/db/db';
  
  let dbReady = false;

  onMount(async () => {
    await initDB(); 
    dbReady = true;
  });
</script>

{#if dbReady}
  <!-- Adjusted pb-24 to pb-8 since navbar is gone -->
  <main class="min-h-screen relative p-4 pb-8">
    <slot />
  </main>
{:else}
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center">
      <p class="text-xl animate-pulse text-blue-600 font-semibold">Initializing KJV Bible App...</p>
      <p class="text-sm text-gray-500">This takes longer on first launch.</p>
    </div>
  </div>
{/if}