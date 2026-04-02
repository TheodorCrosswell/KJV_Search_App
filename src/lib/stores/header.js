import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<string>} */
export const headerTitle = writable('');

/** @type {import('svelte/store').Writable<(() => void) | null>} */
export const headerAction = writable(null); // Function for custom back action

/** @type {import('svelte/store').Writable<string>} */
export const headerActionText = writable('Home'); // Default back button text