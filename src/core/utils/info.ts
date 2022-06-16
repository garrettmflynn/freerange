import Codecs from '../codecs/Codecs'

export const zipped = (suffix, mimeType?, codecs?:Codecs) => (mimeType && mimeType === codecs.getType('gz')) || suffix.includes('gz')

const fullSuffix = (fileName='') => (fileName).split('.').slice(1)

// Ignores Zipped
export const suffix = (fileName='') => {
    const suffix = fullSuffix(fileName) // Allow no name
    const isZip = zipped(suffix)
    if (isZip) suffix.pop() // Pop off .gz
    return suffix.join('.')
}

export const name = (path) => path.split('/').slice(-1)[0]
export const directory = (path) => path.split('/').slice(0, -1).join('/')

export const esm = (suffix) => (suffix === 'js' || suffix === 'mjs')

export const get = (type, name?:string, codecs?: Codecs) => {    
    // Swap file mimeType if zipped
    let mimeType = type
    const isZipped = zipped(fullSuffix(name), mimeType, codecs)
    const sfx = suffix(name)
    if (isZipped || !mimeType) mimeType = codecs.getType(sfx)
    if (esm(sfx)) mimeType = codecs.getType('js') // Override MimeType for ESM files

    return { mimeType, zipped: isZipped, suffix: sfx }
}