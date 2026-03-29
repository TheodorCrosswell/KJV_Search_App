import Dexie from 'dexie';

// 1. Define the database class to tell Dexie (and your IDE) about the tables
class BibleDatabase extends Dexie {
	constructor() {
		super('BiblePWA');
		
		this.version(2).stores({
			kjv_text: 'id, citation, book, [book+chapter]',

			// id: "Genesis_1"
			reading_progress: 'id, completion_date, completion_counts',

			// citation: "Genesis_1"
			memory_queue: 'citation',

			// id: "Genesis_1_1"
			// [citation+current_level] allows fast querying of fully memorized verses per chapter
			memory_progress: 'id, citation, current_level, last_practiced_at,[citation+current_level]'
		});

		// 2. Map the tables so they are recognized as properties
		this.kjv_text = this.table('kjv_text');
		this.reading_progress = this.table('reading_progress');
		this.memory_queue = this.table('memory_queue');
		this.memory_progress = this.table('memory_progress');
	}
}

// 3. Export a single instance of the class
export const db = new BibleDatabase();

export async function initDB() {
	const count = await db.kjv_text.count();
	if (count === 0) {
		try {
			const res = await fetch('/kjv-data.json');
			if (!res.ok) throw new Error('Failed to fetch kjv-data.json');
			const data = await res.json();
			await db.kjv_text.bulkAdd(data);
		} catch (error) {
			console.error("Database initialization failed:", error);
		}
	}
}