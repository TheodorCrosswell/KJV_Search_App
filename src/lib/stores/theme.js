import { writable, get } from 'svelte/store';

// Check if we are running in the browser (prevents Server-Side Rendering errors)
const browser = typeof window !== 'undefined';

// Get initial values from localStorage or fallback to defaults
const initialDark = browser ? localStorage.getItem('isDarkMode') === 'true' : false;
const initialColor = browser ? localStorage.getItem('themeColor') || '#2563eb' : '#2563eb';

// Create the Svelte writable stores
export const isDarkMode = writable(initialDark);
export const themeColor = writable(initialColor);

// If in the browser, listen for changes and update localStorage and CSS variables
if (browser) {
	function applyTheme() {
		const dark = get(isDarkMode);
		const color = get(themeColor);

		// Save to localStorage
		localStorage.setItem('isDarkMode', String(dark));
		localStorage.setItem('themeColor', color);

		// Update CSS variables dynamically in real-time
		const root = document.documentElement;
		root.style.setProperty('--theme-color', color);
		root.style.setProperty('--theme-light', `color-mix(in srgb, ${color} 20%, transparent)`);
		root.style.setProperty('--bg-main', dark ? '#111827' : '#f9fafb');
		root.style.setProperty('--bg-card', dark ? '#1f2937' : '#ffffff');
		root.style.setProperty('--text-main', dark ? '#f9fafb' : '#111827');
		root.style.setProperty('--text-muted', dark ? '#9ca3af' : '#6b7280');
		root.style.setProperty('--border-color', dark ? '#374151' : '#e5e7eb');
		root.style.setProperty('--hover-bg', dark ? '#374151' : '#f3f4f6');
		root.style.setProperty('--header-bg', dark ? 'color-mix(in srgb, #111827 95%, transparent)' : 'color-mix(in srgb, #f9fafb 95%, transparent)');
	}

	// Subscribe to stores so applyTheme runs whenever they change
	isDarkMode.subscribe(applyTheme);
	themeColor.subscribe(applyTheme);
}