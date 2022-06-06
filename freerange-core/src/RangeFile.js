import { getFileData, getInfo } from './index.js'
import { isClass } from './utils/utils.js'
import request from './request.js'

export default class RangeFile {
    constructor(file, options = {}) {

        this.debug = options.debug
        this.manager = options.manager

        this.method = (file.origin && file.path) ? 'remote' : 'local' // 'remote'
        // this.edited = false

        if (this.method === 'remote') {
            this.remote = file
            const split = file.path.split('/')
            file.name = split[split.length - 1]
            this.options = file.options
            this.type = null // No types provided // TODO: Get this from a file header
        }

        this.name = file.name
        this.type = file.type

        this.file = file // Might just be a spoof objecct

        // Unpack File Info
        const { mimeType, zipped, extension } = getInfo(this.file)
        this.mimeType = mimeType
        this.zipped = zipped
        this.extension = extension

        this.data = {}
        this.storage = {}
        this[`#original`] = null
    }


    init = async () => {

        // Only Load Buffer for Local Mode

        if (this.method === 'local') {
            if (!(this.file instanceof Blob)) { // Catches files and blobs
                const buffer = await this.set(this.file.data) // Load the file data
                const newFile = new Blob([buffer]) // Create an object that is recognized as a file
                newFile.name = this.file.name
                this.file = newFile
            }

            this.storage = await getFileData(this.file).catch(this.onError)
            // await this.get() // Get files right away (test)
        }


        this.config = this.manager.extensions?.[this.mimeType]?.config
        await this.setupByteGetters()
    }

    get = async () => {
        // Re-Encode to a Buffer
        try {
            // Decode
            const ticDecode = performance.now()
            if (!this[`#body`]) this[`#body`] = await this.manager.decode(this.storage, this.file).catch(this.onError)
            const tocDecode = performance.now()
            if (this.debug) console.warn(`Time to Decode: ${tocDecode - ticDecode}ms`)

            // Track Original Object
            const tic = performance.now()
            if (!this['#original']) {

                // Don't stringify classes
                // TODO: May also need to account for large files in a different way...
                if (isClass(this['#body'])) {
                    this[`#original`] = this[`#body`]
                } else {
                    try {
                        this[`#original`] = JSON.parse(JSON.stringify(this[`#body`]))
                    } catch (e) {
                        this[`#original`] = this[`#body`]
                        console.warn('Could not deep clone', e)
                    }
                }
            }
            const toc = performance.now()
            if (this.debug) console.warn(`Time to Deep Clone: ${toc - tic}`)

            // Return Cache
            return this[`#body`]
        } catch (e) {
            const msg = `No decoder for ${this.name} - ${this.type || 'No file type recognized'}`
            console.warn(msg, e)
            return {}
        }
    }

    set = async (o) => {

        console.warn("Currently doesn't set the buffer iteratively...")

        try {

            // Encode New Object
            const ticEncode = performance.now()
            this.storage.buffer = await this.manager.encode(o, this.file).catch(this.onError)
            const tocEncode = performance.now()
            if (this.debug) console.warn(`Time to Encode: ${tocEncode - ticEncode}ms`)

            // Reset Cache
            this[`#body`] = o
            return this.storage.buffer
        } catch (e) {
            console.error('Could not encode as a buffer', o, this.mimeType, this.zipped)
            this.onError(e)
        }
    }



    export = async () => {
        if (this[`#body`] === this[`#original`]) return this.storage.buffer
        else return await this.set(this[`#body`]) // Re-encode cache data
    }

    onError = (e) => {
        console.error(e)
    }

    // -------------------- Range Request Support --------------------
    getFromBytes = async (key, property = this.config.properties[key], parent, i) => {

        if (property) {

            const start = await this.getProperty(property.start, parent, i)
            const length = await this.getProperty(property.length, parent, i)

            // Asynchronout
            let bytes
            if (this.method === 'remote') {
                bytes = await this.getRemote({ key, start, length })
                    .catch(console.error)
            }

            // Synchronous
            else {
                bytes = this.storage.buffer.slice(start, start + length)
            }


            let output = (property.ignoreGlobalPostprocess) ? bytes : this.config.preprocess(bytes)
            if (property.postprocess instanceof Function) output = await property.postprocess(output, this.data, i)

            return output

        } else {
            console.warn(`No getter for ${key}`)
        }
    }

    getProperty = async (property, parent, i) => {
        if (property instanceof Function) {
            try {
                return property(this.data, parent, i).catch(e => console.error(e))
            } catch {
                return property(this.data, parent, i)
            }
        } else return property
    }

    defineProperty = async (key, property, parent, i) => {

        // Byte Property
        if ('start' in property && property.length) {
            Object.defineProperties(parent, {
                [key]: {
                    enumerable: true,
                    get: () => {
                        if (!parent[`#${key}`]) parent[`#${key}`] = this.getFromBytes(key, property, parent, i);
                        return parent[`#${key}`]
                    }
                    // TODO: Define setters!
                },
                [`#${key}`]: {
                    writable: true,
                    enumerable: false
                }
            })
        }

        // Nested Properties
        else if (property.n && property.properties) {

            this.data[key] = []

            const n = await this.getProperty(property.n, property)

            for (let i = 0; i < n; i++) {
                const value = {}
                Object.defineProperty(value, 'n', { get: () => n }) // Track n
                for (let prop in property.properties) {
                    await this.defineProperty(prop, property.properties[prop], value, i)
                }
                this.data[key].push(value)
            }
        }
    }


    setupByteGetters = async () => {
        if (this.config) {

            // Create Class Method Getters for Bytes
            for (let key in this.config.properties) await this.defineProperty(key, this.config.properties[key], this.data)

            // Create Required Metadata
            if (this.config.metadata instanceof Function) await this.config.metadata(this.data, this.config)


        } else {
            Object.defineProperties(this, {
                ['body']: {
                    enumerable: true,
                    get: async () => this.get(),
                    set: async (o) => this.set(o)
                },
                [`#body`]: {
                    writable: true,
                    enumerable: false
                }
            })
        }
    }


    // -------------------- Remote Support --------------------
    request = request

    getRemote = async (property) => {

        let { start, length } = property
        const options = Object.assign({}, this.options)
        if (!Array.isArray(start)) start = [start]

        if (start.length < 1) return new Int8Array() // Ignore empty start array
        else {
            
            let Range = `bytes=${start.map(val => `${(length) ? `${val}-${val + length - 1}` : val}`).join(', ')}`
            
            // Limited by the header size limit on the server (--max-http-header-size=16000 by default)!
            const maxHeaderLength = 15000 // Slightly less to account for other headers
            if (Range.length > maxHeaderLength) {
                const splitRange = Range.slice(0, maxHeaderLength).split(', ')
                console.warn(`Only sending ${splitRange.length - 1} from ${start.length} range requests to remain under the --max-http-header-size=${1600} limit`)
                Range = splitRange.slice(0, splitRange.length - 1).join(', ')
                console.log('New Range', Range.length)
            }

            // Set Headers
            options.headers = Object.assign({ Range }, options.headers)
            const buffer = await request(`${this.remote.origin}/${this.file.path}`, options)
            return buffer
        }
    }
}