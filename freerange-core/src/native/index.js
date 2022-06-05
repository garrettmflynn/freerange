 export const openFileTree = async (initialDirectoryHandle, path) => {
    let directoryHandle = initialDirectoryHandle
    const pathTokens = path.split('/')
    const dirTokens = pathTokens.slice(0, -1)
    const filename = pathTokens.slice(-1)
    if (dirTokens.length > 0) {
        for (const token of dirTokens) {
            directoryHandle = await directoryHandle.getDirectoryHandle(token, {
                create: true,
            })
        }
    }
    return directoryHandle.getFileHandle(filename, { create: true })
}


export const downloadNative = async (filesToDownload, progressCallback) => {

        const dirHandle = await window.showDirectoryPicker()

        const promises = filesToDownload.map(async (file, index) => {
            const relativePath = file.webkitRelativePath ?? file.relativePath
            const fileHandle = await openFileTree(dirHandle, relativePath)
            if (fileHandle.size == file.size) return // Skip files which are already complete
            const writable = await fileHandle.createWritable()
            const stream = file.stream()
            await stream.pipeTo(writable)
            // const { body, status, statusText } = await fetch(file.urls.pop())
            // if (status === 200) await body.pipeTo(writable)
            // else console.error('Error', statusText)
            progressCallback((index+1) / filesToDownload.length, filesToDownload.length)
        })
        await Promise.allSettled(promises)
}
