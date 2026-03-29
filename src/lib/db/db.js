import Dexie from 'dexie';

// 1. Define the current version of your DATA (independent of Dexie schema version)
const KJV_DATA_VERSION = 2; // Increment this whenever you update kjv-data.json

class BibleDatabase extends Dexie {
    constructor() {
        super('KJVBible');
        
        this.version(3).stores({
            kjv_text: 'id, citation, book,[book+chapter]',
            reading_progress: 'id, completion_date, completion_counts',
            memory_queue: 'citation',
            memory_progress: 'id, citation, current_level, last_practiced_at, [citation+current_level]',
            metadata: 'key' 
        });

        // Add version 4 for the new schema
        this.version(4).stores({
            kjv_text: 'id, citation, book, [book+chapter]',
            reading_progress: 'id, completion_date, is_completed',
            memory_queue: 'citation',
            memory_progress: 'id, citation, current_level, last_practiced_at, [citation+current_level]',
            metadata: 'key' 
        }).upgrade(async tx => {
            // Migrate old progress items:
            const allProgress = await tx.reading_progress.toArray();
            let globalMin = 0;
            if (allProgress.length === 1189) {
                const counts = allProgress.map(p => p.completion_counts || 0);
                globalMin = Math.min(...counts);
            }
            if (globalMin > 0) {
                await tx.metadata.put({ key: 'completion_counts', value: globalMin });
            }
            // Replace completion_counts with is_completed mapping
            return tx.reading_progress.toCollection().modify(progress => {
                if ((progress.completion_counts || 0) > globalMin) {
                    progress.is_completed = true;
                } else {
                    progress.is_completed = false;
                }
                delete progress.completion_counts;
            });
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
        const storedVersionRecord = await db.metadata.get('kjv_data_version');
        const currentInstalledVersion = storedVersionRecord ? storedVersionRecord.value : 0;

        if (currentInstalledVersion < KJV_DATA_VERSION) {
            console.log(`Updating data: ${currentInstalledVersion} -> ${KJV_DATA_VERSION}`);
            
            const res = await fetch(`/kjv-data.json?v=${KJV_DATA_VERSION}`);
            if (!res.ok) throw new Error('Failed to fetch kjv-data.json');
            const data = await res.json();

            await db.transaction('rw', [db.kjv_text, db.metadata], async () => {
                await db.kjv_text.clear();
                await db.kjv_text.bulkAdd(data);
                await db.metadata.put({ key: 'kjv_data_version', value: KJV_DATA_VERSION });
            });
            console.log("Database updated successfully");
        }
    } catch (error) {
        console.error("Database initialization/update failed:", error);
    }
}