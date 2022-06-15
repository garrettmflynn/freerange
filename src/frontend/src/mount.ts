import { get, set } from 'idb-keyval';

export const mountCache = async (name) => {
    let dirHandle = await get(name);
    if (dirHandle) {
        console.log(`Loaded cached mount "${dirHandle.name}" from IndexedDB.`)
        return dirHandle
    }
    else return // Nothing in the cache
}