import { get, set } from 'idb-keyval';

const cacheName = `freerange-history`
const maxHistory = 10

export const getCache = async () => {
    let dirHandleArray = await get(cacheName);
    if (dirHandleArray) {
        console.log(`Loaded cached mounts "${dirHandleArray.map(d => d.name)}" from IndexedDB.`)
        return dirHandleArray
    }
    else return // Nothing in the cache
}

export const setCache = async (info) => {
    // console.log('Init', info)
    let history = await get(cacheName)
    if (!history) history = [info]
    else if (!history.includes(info)){
        history.push(info)
        if (history.length > maxHistory) history.shift() // Shift history if over the maximum
    }
    console.log(cacheName, history)
    set(cacheName, history)
}