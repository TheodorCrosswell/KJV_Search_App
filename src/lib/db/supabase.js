import { createClient } from '@supabase/supabase-js';
import { db } from './db.js';

// Ensure these are set in your .env file
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Safely parses timestamps from either epoch integers (Dexie) or ISO Strings (Supabase)
 * @param {number|string|null|undefined} val
 * @returns {number}
 */
const getTimestamp = (val) => {
    if (!val) return 0;
    const time = new Date(val).getTime();
    return isNaN(time) ? 0 : time;
};

/**
 * Synchronizes local Dexie data with Supabase using a Last-Write-Wins approach.
 * @param {string} userId 
 * @returns {Promise<void>}
 */
export async function syncData(userId) {
    if (!supabase) return;

    const tables = [
        { name: 'reading_progress', pk: 'id' },
        { name: 'memory_queue', pk: 'citation' },
        { name: 'memory_progress', pk: 'id' },
        { name: 'latest_reading', pk: 'id' },
        { name: 'settings', pk: 'key' },
        { name: 'favorite_verses', pk: 'id' }
    ];

    for (const { name, pk } of tables) {
        try {
            const localData = await db.table(name).toArray();
            const localMap = new Map(localData.map(item => [item[pk], item]));

            // 1. Fetch remote data in batches to bypass Supabase's 1000 row default limit
            let remoteData = [];
            let fetchError = null;
            let start = 0;
            const limit = 1000;

            while (true) {
                const { data, error } = await supabase
                    .from(name)
                    .select('*')
                    .eq('user_id', userId)
                    .range(start, start + limit - 1);

                if (error) {
                    fetchError = error;
                    break;
                }

                if (data) remoteData.push(...data);
                
                // If we get fewer records than the limit, we've reached the end
                if (!data || data.length < limit) break;
                
                start += limit;
            }

            if (fetchError) {
                console.error(`Sync error on ${name}:`, fetchError.message);
                continue;
            }

            const remoteMap = new Map(remoteData.map(item => [item[pk], item]));

            /** @type {Array<any>} */
            const toUpload = [];
            /** @type {Array<any>} */
            const toDownload = [];

            // 2. Find local items that need to be uploaded
            for (const localItem of localData) {
                const remoteItem = remoteMap.get(localItem[pk]);
                const localTime = getTimestamp(localItem.updated_at);
                const remoteTime = remoteItem ? getTimestamp(remoteItem.updated_at) : 0;

                if (!remoteItem || localTime > remoteTime) {
                    toUpload.push({ ...localItem, user_id: userId });
                }
            }

            // 3. Find remote items that need to be downloaded
            for (const remoteItem of remoteData) {
                const localItem = localMap.get(remoteItem[pk]);
                const remoteTime = getTimestamp(remoteItem.updated_at);
                const localTime = localItem ? getTimestamp(localItem.updated_at) : 0;

                if (!localItem || remoteTime > localTime) {
                    const { user_id, ...localFormat } = remoteItem;
                    toDownload.push(localFormat);
                }
            }

            // Apply updates
            if (toUpload.length > 0) {
                await supabase.from(name).upsert(toUpload);
            }
            if (toDownload.length > 0) {
                await db.table(name).bulkPut(toDownload);
            }
        } catch (err) {
            console.error(`Unexpected error syncing table ${name}:`, err);
        }
    }
}