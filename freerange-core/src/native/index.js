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