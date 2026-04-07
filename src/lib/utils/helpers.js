import { writable, get } from 'svelte/store';

/** @type {Record<string, number>} */
export const BIBLE_BOOKS = {
  // Old Testament
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, "Song of Solomon": 8, Isaiah: 66, Jeremiah: 52,
  Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3,
  Haggai: 2, Zechariah: 14, Malachi: 4,

  // New Testament
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16,
  "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1, Hebrews: 13,
  James: 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1,
  "3 John": 1, Jude: 1, Revelation: 22
};

/** @type {Record<string, string>} */
export const BOOK_ABBREVIATIONS = {
  Genesis: 'Ge', Exodus: 'Ex', Leviticus: 'Le', Numbers: 'Nu', Deuteronomy: 'De',
  Joshua: 'Jo', Judges: 'Ju', Ruth: 'Ru', '1 Samuel': '1S', '2 Samuel': '2S',
  '1 Kings': '1K', '2 Kings': '2K', '1 Chronicles': '1C', '2 Chronicles': '2C',
  Ezra: 'Ez', Nehemiah: 'Ne', Esther: 'Es', Job: 'Jb', Psalms: 'Ps',
  Proverbs: 'Pr', Ecclesiastes: 'Ec', 'Song of Solomon': 'SoS', Isaiah: 'Is',
  Jeremiah: 'Je', Lamentations: 'La', Ezekiel: 'Ek', Daniel: 'Da', Hosea: 'Ho',
  Joel: 'Jl', Amos: 'Am', Obadiah: 'Ob', Jonah: 'Jh', Micah: 'Mi', Nahum: 'Na',
  Habakkuk: 'Ha', Zephaniah: 'Ze', Haggai: 'Hg', Zechariah: 'Zc', Malachi: 'Ma',
  Matthew: 'Mt', Mark: 'Mk', Luke: 'Lu', John: 'Jn', Acts: 'Ac', Romans: 'Ro',
  '1 Corinthians': '1C', '2 Corinthians': '2C', Galatians: 'Ga', Ephesians: 'Ep',
  Philippians: 'Ph', Colossians: 'Co', '1 Thessalonians': '1T', '2 Thessalonians': '2T',
  '1 Timothy': '1Ti', '2 Timothy': '2Ti', Titus: 'Ti', Philemon: 'Pm', Hebrews: 'He',
  James: 'Ja', '1 Peter': '1P', '2 Peter': '2P', '1 John': '1J', '2 John': '2J',
  '3 John': '3J', Jude: 'Jd', Revelation: 'Re'
};

export const TOTAL_CHAPTERS = 1189;

/**
 * @param {string} word
 * @returns {string}
 */
export function stripPunctuation(word) {
	return word.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function getFirstLetters(text) {
	return text
		.split(' ')
		.map((word) => {
			const cleanWord = stripPunctuation(word);
			return cleanWord.length > 0 ? cleanWord[0].toLowerCase() : '';
		})
		.filter((l) => l !== '');
}

/**
 * @param {import('../db/db').BibleDatabase} db
 * @returns {Promise<{globalMin: number, completedInCycle: number, progressMap: any[]}>}
 */
export async function getCycleStats(db) {
	const progress = await db.reading_progress.toArray();
    
    const countRecord = await db.metadata.get('completion_counts');
    const globalMin = countRecord ? countRecord.value : 0;

	const completedInCycle = progress.filter((/** @type {any} */ p) => p.is_completed).length;

	return { globalMin, completedInCycle, progressMap: progress };
}

/**
 * Reusable Action for Long Press mapping
 * @param {any} node
 * @param {number} threshold
 */
export function longpress(node, threshold = 500) {
	/** @type {any} */
	let timer;
	/** @type {number} */
	let startX;
	/** @type {number} */
	let startY;

	const start = (/** @type {any} */ e) => {
		if (e.type === 'touchstart') {
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
		}
		timer = setTimeout(() => {
			node.dispatchEvent(new CustomEvent('longpress'));
			// @ts-ignore
			if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
		}, threshold);
	};

	const cancel = () => clearTimeout(timer);

	const move = (/** @type {any} */ e) => {
		if (e.type === 'touchmove') {
			const dx = Math.abs(e.touches[0].clientX - startX);
			const dy = Math.abs(e.touches[0].clientY - startY);
			if (dx > 10 || dy > 10) cancel();
		} else {
			cancel();
		}
	};

    const preventCtx = (/** @type {any} */ e) => e.preventDefault();

	node.addEventListener('mousedown', start);
	node.addEventListener('touchstart', start, { passive: true });
	node.addEventListener('mouseup', cancel);
	node.addEventListener('mouseleave', cancel);
	node.addEventListener('touchend', cancel);
	node.addEventListener('touchmove', move, { passive: true });
    node.addEventListener('contextmenu', preventCtx);

	return {
		destroy() {
			node.removeEventListener('mousedown', start);
			node.removeEventListener('touchstart', start);
			node.removeEventListener('mouseup', cancel);
			node.removeEventListener('mouseleave', cancel);
			node.removeEventListener('touchend', cancel);
			node.removeEventListener('touchmove', move);
            node.removeEventListener('contextmenu', preventCtx);
		}
	};
}

/**
 * Centralized Selection Manager for generic lists
 */
export function createSelectionManager() {
	const selected = writable(new Set());
	const selectionMode = writable(false);
	let justLongPressed = false;

	function toggle(/** @type {any} */ id) {
		selected.update(s => {
			const newSet = new Set(s);
			if (newSet.has(id)) {
				newSet.delete(id);
				if (newSet.size === 0) selectionMode.set(false);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	}

	function clear() {
		selected.set(new Set());
		selectionMode.set(false);
	}

	function handleLongPress(/** @type {any} */ id) {
		if (get(selectionMode)) return;
		selectionMode.set(true);
		justLongPressed = true;
		toggle(id);
		setTimeout(() => justLongPressed = false, 1000);
	}

	function handleClick(/** @type {any} */ id, /** @type {() => void | undefined} */ defaultAction) {
		if (justLongPressed) {
			justLongPressed = false;
			return;
		}
		if (get(selectionMode)) {
			toggle(id);
		} else if (defaultAction) {
			defaultAction();
		}
	}

	return { selected, selectionMode, clear, handleLongPress, handleClick };
}

/**
 * Copies the text of the selected verses to the clipboard and clears the selection
 * @param {Set<any>} selectedIds 
 * @param {Array<any>} verses 
 * @param {() => void} clearFn 
 */
export async function copySelected(selectedIds, verses, clearFn) {
	const sortedVerses = verses.filter(v => selectedIds.has(v.id));
	const textToCopy = sortedVerses.map(v => `${v.citation} ${v.text}`).join('\n');
	
	try {
		await navigator.clipboard.writeText(textToCopy);
	} catch (err) {
		console.error('Failed to copy text: ', err);
	}
	clearFn();
}

/**
 * Adds selected verses to favorites in the DB, updates local state, and clears selection
 * @param {Set<any>} selectedIds 
 * @param {Array<any>} verses 
 * @param {Set<any>} favoriteIds 
 * @param {import('../db/db').BibleDatabase} db 
 * @param {(newFavs: Set<any>) => void} updateFavsFn 
 * @param {() => void} clearFn 
 */
export async function favoriteSelected(selectedIds, verses, favoriteIds, db, updateFavsFn, clearFn) {
	const sortedVerses = verses.filter(v => selectedIds.has(v.id));
	let updatedFavs = new Set(favoriteIds);
	
	for (let v of sortedVerses) {
		if (!updatedFavs.has(v.id)) {
			await db.favorite_verses.put({
				id: v.id,
				citation: v.citation,
				timestamp: Date.now()
			});
			updatedFavs.add(v.id);
		}
	}
	
	updateFavsFn(updatedFavs);
	clearFn();
}

/**
 * Navigates directly to the first selected verse's chapter in the reader
 * @param {Set<any>} selectedIds 
 * @param {Array<any>} verses 
 * @param {(url: string) => void} gotoFn 
 */
export function locateSelected(selectedIds, verses, gotoFn) {
	const firstSelectedId = Array.from(selectedIds)[0];
	const targetVerse = verses.find(v => v.id === firstSelectedId);
	
	if (targetVerse && targetVerse.book) {
		gotoFn(`/read/${targetVerse.book}/${targetVerse.chapter}`);
	}
}

/**
 * Marks selected chapters/books as read or unread
 * @param {Set<any>} selectedIds 
 * @param {string | null} selectedBook 
 * @param {boolean} isRead 
 * @param {Set<string>} readChapters 
 * @param {import('../db/db').BibleDatabase} db 
 * @param {(updated: Set<string>) => void} updateReadChaptersFn 
 * @param {() => void} clearFn 
 */
export async function markSelectedAs(selectedIds, selectedBook, isRead, readChapters, db, updateReadChaptersFn, clearFn) {
	const now = Date.now();
	/** @type {Array<any>} */
	const updates = [];
	let updatedReadChapters = new Set(readChapters);
	
	if (!selectedBook) {
		for (const book of selectedIds) {
			const total = BIBLE_BOOKS[book];
			for (let i = 1; i <= total; i++) {
				updates.push({ id: `${book}_${i}`, completion_date: now, is_completed: isRead });
				if (isRead) updatedReadChapters.add(`${book}_${i}`);
				else updatedReadChapters.delete(`${book}_${i}`);
			}
		}
	} else {
		for (const chap of selectedIds) {
			updates.push({ id: `${selectedBook}_${chap}`, completion_date: now, is_completed: isRead });
			if (isRead) updatedReadChapters.add(`${selectedBook}_${chap}`);
			else updatedReadChapters.delete(`${selectedBook}_${chap}`);
		}
	}
	
	await db.reading_progress.bulkPut(updates);
	updateReadChaptersFn(updatedReadChapters);
	clearFn();
}

/**
 * Adds or removes selected chapters/books from the memory queue
 * @param {Set<any>} selectedIds 
 * @param {string | null} selectedBook 
 * @param {boolean} add 
 * @param {import('../db/db').BibleDatabase} db 
 * @param {() => void} clearFn 
 */
export async function memorySelected(selectedIds, selectedBook, add, db, clearFn) {
	/** @type {Array<any>} */
	const updates = [];
	/** @type {Array<string>} */
	const deletes = [];
	
	if (!selectedBook) {
		for (const book of selectedIds) {
			const total = BIBLE_BOOKS[book];
			for (let i = 1; i <= total; i++) {
				const citation = `${book}_${i}`;
				if (add) updates.push({ citation });
				else deletes.push(citation);
			}
		}
	} else {
		for (const chap of selectedIds) {
			const citation = `${selectedBook}_${chap}`;
			if (add) updates.push({ citation });
			else deletes.push(citation);
		}
	}
	
	if (add) await db.memory_queue.bulkPut(updates);
	else await db.memory_queue.bulkDelete(deletes);
	clearFn();
}