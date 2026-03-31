<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { initDB } from '$lib/db/db';
  import { fontSize } from '$lib/stores/ui'; // <-- Import the store
  
  let dbReady = false;

  onMount(async () => {
    // Check if mobile device to initialize a larger base font size
    if (window.innerWidth < 768) {
      fontSize.set(22);
    }

    await initDB(); 
    dbReady = true;
  });
</script>

{#if dbReady}
  <!-- Global Top App Bar -->
  {#if $page.url.pathname !== '/'}
    <div class="sticky top-0 z-50 w-full bg-gray-50/95 px-4 py-3 shadow-sm backdrop-blur-sm border-b border-gray-200">
      <a href="/" class="inline-flex items-center min-h-[44px] md:min-h-0 font-semibold text-blue-600 transition-colors hover:text-blue-800 active:scale-95">
        <svg class="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        Home
      </a>
    </div>
  {/if}

  <main class="min-h-screen relative p-4 pb-8 max-w-7xl mx-auto w-full">
    <slot />
  </main>
{:else}
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <p class="animate-pulse text-xl font-semibold text-blue-600">Initializing KJV Bible App...</p>
      <p class="text-sm text-gray-500">This takes longer on first launch.</p>
    </div>
  </div>
{/if}