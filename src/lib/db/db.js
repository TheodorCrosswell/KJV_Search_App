import Dexie from 'dexie';

const KJV_TOTAL_VERSES = 31102;

class BibleDatabase extends Dexie {
    constructor() {
        super('KJVBible');
        
        this.version(1).stores({
            kjv_text: 'id, citation, book, [book+chapter]',
            reading_progress: 'id, completion_date, is_completed',
            memory_queue: 'citation',
            memory_progress: 'id, citation, current_level, last_practiced_at, [citation+current_level]',
            metadata: 'key' 
        });

        this.kjv_text = this.table('kjv_text');
        this.reading_progress = this.table('reading_progress');
        this.memory_queue = this.table('memory_queue');
        this.memory_progress = this.table('memory_progress');
        this.metadata = this.table('metadata');
    }
}

export const db = new BibleDatabase();

export async function initDB() {
    try {
        const count = await db.kjv_text.count();

        // Check if data is missing OR incomplete
        if (count !== KJV_TOTAL_VERSES) {
            console.log(`Database count (${count}) is incorrect. Expected ${KJV_TOTAL_VERSES}. Reloading...`);
            
            // 1. Fetch the data first 
            // (If the network fails here, the existing data stays untouched)
            const res = await fetch('/kjv-data.json');
            if (!res.ok) throw new Error('Failed to fetch kjv-data.json');
            const data = await res.json();

            // 2. Validate the fetched data before touching the DB
            if (!Array.isArray(data) || data.length !== KJV_TOTAL_VERSES) {
                throw new Error(`Fetched JSON size mismatch. Got ${data.length} items.`);
            }

            // 3. Use a transaction to clear and refill
            // This ensures "All or Nothing" - if the tab closes during bulkAdd,
            // the table will revert to its previous state.
            await db.transaction('rw', db.kjv_text, async () => {
                await db.kjv_text.clear();
                await db.kjv_text.bulkAdd(data);
            });

            console.log("Database populated successfully with 31,102 verses.");
        }
    } catch (error) {
        console.error("Database initialization failed:", error);
    }
}