import { RegistryType } from "./types"

export const zipped = (extension, mimeType?, registry={}) => (mimeType && mimeType === registry['gz']) || extension.includes('gz')

const fullExtension = (fileName='') => (fileName).split('.').slice(1)

// Ignores Zipped
export const extension = (fileName='') => {
    const extension = fullExtension(fileName) // Allow no name
    const isZip = zipped(extension)
    if (isZip) extension.pop() // Pop off .gz
    return extension.join('.')
}

export const name = (path) => path.split('/').slice(-1)[0]
export const directory = (path) => path.split('/').slice(0, -1).join('/')

export const esm = (ext) => (ext === 'js' || ext === 'mjs')

export const get = (file, registry:RegistryType = {}) => {    
    // Swap file mimeType if zipped
    let mimeType = file.type
    const isZipped = zipped(fullExtension(file.name), mimeType, registry)
    const ext = extension(file.name)
    if (isZipped || !mimeType) mimeType = registry?.[ext]
    if (esm(ext)) mimeType = registry['js'] // Override MimeType for ESM files
    return { mimeType, zipped: isZipped, extension: ext }
}