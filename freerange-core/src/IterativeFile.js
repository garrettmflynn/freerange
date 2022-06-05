import { getFileData, getInfo } from './index.js'
import { isClass } from './utils/utils.js'

export default class IterativeFile {
    constructor(file, options={}){

        this.debug = options.debug
        this.manager = options.manager

        this.edited = false
        this.name = file.name
        this.type = file.type

        this.file = file // Might just be a spoof objecct

        // Unpack File Info
        const {mimeType, zipped, extension} = getInfo(this.file)
        this.mimeType = mimeType
        this.zipped = zipped
        this.extension = extension
       
        this.data = {}
        this[`#cache`] = this[`#original`] = null
    }


    init = async () => {
        if (!(this.file instanceof Blob)) { // Catches files and blobs
            const buffer = await this.set(this.file.data) // Load the file data
            const newFile = new Blob([buffer]) // Create an object that is recognized as a file
            newFile.name = this.file.name
            this.file = newFile
        }

        this.data = await getFileData(this.file).catch(this.onError)
        // await this.get() // Get files right away (test)
    }

    // Read Buffer Data
    get = async () => {
        try {
            // Decode
            const ticDecode = performance.now()
            if (!this[`#cache`]) this[`#cache`] = await this.manager.decode(this.data, this.file).catch(this.onError)
            const tocDecode = performance.now()
            if (this.debug) console.warn(`Time to Decode: ${tocDecode-ticDecode}ms`)

            // Track Original Object
            const tic = performance.now()
            if (!this['#original']) {

                // Don't stringify classes
                // TODO: May also need to account for large files in a different way...
                if (isClass(this['#cache'])){
                    this[`#original`] = this[`#cache`]
                } else {
                    try {
                        this[`#original`] = JSON.parse(JSON.stringify(this[`#cache`]))
                    } catch (e) {
                        this[`#original`] = this[`#cache`]
                        console.warn('Could not deep clone', e)
                    }
                }
            }
            const toc = performance.now()
            if (this.debug) console.warn(`Time to Deep Clone: ${toc-tic}`)

            // Return Cache
            return this[`#cache`]
        } catch (e) {
            const msg = `No decoder for ${this.name} - ${this.type || 'No file type recognized'}`
            console.warn(msg, e)
            return {}
        }
    }

    // Re-Encode to a Buffer
    set = async (o) => {

        console.warn("Currently doesn't set the buffer iteratively...")

        try {
            
            // Encode New Object
            const ticEncode = performance.now()
            this.data.buffer = await this.manager.encode(o, this.file).catch(this.onError)
            const tocEncode = performance.now()
            if (this.debug) console.warn(`Time to Encode: ${tocEncode-ticEncode}ms`)

            // Reset Cache
            this[`#cache`] = o
            return this.data.buffer
        } catch (e) { 
            console.error('Could not encode as a buffer', o, this.mimeType, this.zipped)
            this.onError(e)
        }
    }
    


    export = async () => {
        if (this[`#cache`] === this[`#original`]) return this.data.buffer
        else return await this.set(this[`#cache`]) // Re-encode cache data
    }

    onError = (e) => {
        console.error(e)
    }
}