<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { beforeNavigate } from '$app/navigation';
  import { initDB } from '$lib/db/db';
  import { fontSize } from '$lib/stores/ui'; // <-- Import the store
  import { headerTitle, headerAction, headerActionText } from '$lib/stores/header';
  
  let dbReady = false;

  // Clear header state when navigating to prevent stale titles/buttons
  beforeNavigate(() => {
    headerTitle.set('');
    headerAction.set(null);
    headerActionText.set('Home');
  });

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
    <div class="sticky top-0 z-50 flex min-h-[56px] w-full items-center justify-between bg-gray-50/95 px-4 py-3 shadow-sm backdrop-blur-sm border-b border-gray-200">
      <!-- Left: Navigation Action -->
      <div class="flex items-center w-24 shrink-0">
        {#if $headerAction}
          <button on:click={$headerAction} class="inline-flex items-center min-h-[44px] md:min-h-0 font-semibold text-blue-600 transition-colors hover:text-blue-800 active:scale-95">
            <svg class="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 19l-7-7 7-7" />
            </svg>
            {$headerActionText}
          </button>
        {:else}
          <a href="/" class="inline-flex items-center min-h-[44px] md:min-h-0 font-semibold text-blue-600 transition-colors hover:text-blue-800 active:scale-95">
            <svg class="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </a>
        {/if}
      </div>

      <!-- Center: Title -->
      <div class="flex-1 flex justify-center text-center px-2 overflow-hidden">
        {#if $headerTitle}
          <h1 class="text-lg font-bold text-gray-900 truncate">{$headerTitle}</h1>
        {/if}
      </div>

      <!-- Right: Spacer for balancing the center title -->
      <div class="w-24 shrink-0"></div>
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