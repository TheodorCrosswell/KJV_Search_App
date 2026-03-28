<script>
  import { onMount } from 'svelte';
  import { stripPunctuation } from '$lib/utils/helpers';
  
  export let text = "";
  export let level = 1; // 1: full, 2: 3rd word, 3: blanks
  
  /** @type {(accuracy: number) => void} */
  export let onFinish = (accuracy) => {};

  /** @type {Array<{original: string, stripped: string}>} */
  let words =[];
  
  /** @type {Array<{correct: boolean}>} */
  let userInputs =[];
  
  let currentIndex = 0;
  let errors = 0;

  onMount(() => {
    words = text.split(' ').map(w => ({
      original: w,
      stripped: stripPunctuation(w).toLowerCase()
    })).filter(w => w.stripped.length > 0);
  });

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (currentIndex >= words.length) return;
    
    // Ignore meta keys
    if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
    
    const targetChar = words[currentIndex].stripped[0];
    const isCorrect = e.key.toLowerCase() === targetChar;
    
    if (!isCorrect) errors++;
    
    userInputs =[...userInputs, { correct: isCorrect }];
    currentIndex++;

    if (currentIndex === words.length) {
      const accuracy = (words.length - errors) / words.length;
      onFinish(accuracy);
    }
  }

  /** @param {number} index */
  function isVisible(index) {
    if (currentIndex > index) return true; // Typed
    if (level === 1) return true;
    if (level === 2 && (index + 1) % 3 === 0) return true;
    return false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Added role and aria-label to fix the A11y tabindex warning -->
<div 
  class="text-2xl leading-relaxed flex flex-wrap gap-2 outline-none" 
  tabindex="0"
  role="textbox"
  aria-label="Memory typing practice area"
>
  {#each words as word, i}
    <span class="
      {currentIndex > i && userInputs[i].correct ? 'text-gray-900' : ''}
      {currentIndex > i && !userInputs[i].correct ? 'text-red-500 line-through' : ''}
      {currentIndex === i ? 'border-b-2 border-blue-500' : ''}
      {currentIndex <= i && isVisible(i) ? 'text-gray-400' : ''}
    ">
      {#if currentIndex > i || isVisible(i)}
        {word.original}
      {:else}
        {'_'.repeat(word.original.length)}
      {/if}
    </span>
  {/each}
</div>

<div class="mt-4 text-sm text-gray-500">
  Progress: {currentIndex}/{words.length} | Errors: {errors}
</div>