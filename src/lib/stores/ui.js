import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<number>} */
export const fontSize = writable(18); // Default font size in px

/** @type {import('svelte/store').Writable<string>} */
export const theme = writable('light');