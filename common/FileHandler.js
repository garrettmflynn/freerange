import * as text from './defaults/text.js'
import * as gzip from './defaults/gzip.js'
import * as json from './defaults/json.js'
import * as tsv from './defaults/tsv.js'
import * as csv from './defaults/csv.js'
import * as datauri from './defaults/datauri.js'

export default class FileHandler {
    constructor(options = {}) {
        this.extensions = {}
        this.registry = {}
        this.debug = options.debug

        // Default Loaders
        this.extend(json)
        this.extend(text)
        this.extend(tsv)
        this.extend(csv)
        this.extend(gzip)

    }



    encode = async (o, fileInfo) => {
        const { mimeType, zipped } = this.getInfo(fileInfo) // Spoof the original file

        let buffer = ''
        if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) content = datauri.encode(o)

        const extension = Object.values(this.extensions).find(o => o.mimeType === mimeType)
        if (extension && extension.encode instanceof Function) buffer = extension.encode(o)
        else {
            console.warn(`No encoder for ${mimeType}. Defaulting to text...`)
            buffer = text.encode(o) // Encode as text by default
        }

        if (zipped) buffer = await gzip.encode(buffer)
        return buffer
    }

    getInfo = (file) => {
        let [name, ...extension] = (file.name ?? '').split('.') // Allow no name
        // Swap file mimeType if zipped
        let mimeType = file.type

        console.log(mimeType, this.registry)
        const zipped = (mimeType === this.registry['gz'] || extension.includes('gz'))
        if (zipped) extension.pop() // Pop off .gz
        if (zipped || !mimeType) mimeType = this.registry[extension[0]]
        return { mimeType, zipped, extension: extension.join('.') }
    }

    decode = async (o, fileInfo) => {

        const { mimeType, zipped } = this.getInfo(fileInfo)

        console.log(o, fileInfo, mimeType, zipped)
        if (zipped) o = await gzip.decode(o, mimeType)
        if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) return o.dataurl

        const extension = Object.values(this.extensions).find(o => o.mimeType === mimeType)
        if (extension && extension.decode instanceof Function) return extension.decode(o)
        else {
            console.warn(`No decoder for ${mimeType}. Defaulting to text...`)
            return text.decode(o) // Decode as text by default
        }
    }

    extend = (ext) => {
        this.extensions[ext.mimeType] = ext
        const guessExtension = ext.mimeType.split('-').splice(-1)[0]
        this.registry[ext.extension ?? guessExtension] = ext.mimeType
    }
}