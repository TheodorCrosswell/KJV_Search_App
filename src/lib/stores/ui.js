import { writable } from 'svelte/store';

export const fontSize = writable(18); // Default font size in px
export const theme = writable('light');
