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

export const name = (path) => (path) ? path.split('/').slice(-1)[0] : undefined
export const directory = (path) => (path) ? path.split('/').slice(0, -1).join('/') : undefined

export const esm = (suffix, type) => {
    if (suffix === 'js' || suffix === 'mjs') return true
    else if (type && type.includes('javascript')) return true
    else return false
}

export const get = (type, name?:string, codecs?: Codecs) => {    
    let mimeType = type
    const isZipped = zipped(fullSuffix(name), mimeType, codecs)
    const sfx = suffix(name)

    // swap mimetype if zipped OR plain text (which GitHub provides every file as when raw)
    if (isZipped || !mimeType || mimeType === 'text/plain') mimeType = codecs.getType(sfx)
    if (esm(sfx, mimeType)) mimeType = codecs.getType('js') // Override MimeType for ESM files

    return { mimeType, zipped: isZipped, suffix: sfx }
}