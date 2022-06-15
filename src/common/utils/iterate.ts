// Iterate Asynchronously Through a Collection
const iterAsync = async (iterable, asyncCallback) => {
    const promises = [];
    let i = 0
    for await (const entry of iterable) {
        promises.push(asyncCallback(entry, i));
        i++
    }
    const arr = await Promise.all(promises)
    return arr
}

export default iterAsync