import Dexie from 'dexie';

export const db = new Dexie('BiblePWA');

// In Dexie, the first item is the Primary Key.
// The following items are Secondary Indexes used for fast searching/filtering.
db.version(2).stores({
	kjv_text: 'id, citation, book, [book+chapter]',

	// id: "Genesis_1"
	reading_progress: 'id, completion_date, completion_counts',

	// citation: "Genesis_1"
	memory_queue: 'citation',

	// id: "Genesis_1_1"
	// [citation+current_level] allows fast querying of fully memorized verses per chapter
	memory_progress: 'id, citation, current_level, last_practiced_at,[citation+current_level]'
});

export async function initDB() {
	const count = await db.kjv_text.count();
	if (count === 0) {
		const res = await fetch('/kjv-data.json');
		const data = await res.json();
		await db.kjv_text.bulkAdd(data);
	}
}
