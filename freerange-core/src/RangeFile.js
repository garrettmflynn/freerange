import { getFileData, getInfo } from './index.js'
import { isClass } from './utils/utils.js'
import request from './request.js'

export default class RangeFile {
    constructor(file, options = {}) {

        // Where To Save
        if (file instanceof FileSystemFileHandle) this.fileSystemHandle = file
        if (options.parent) this.parent =  options.parent // Parent in the filesystem

        this.file = file // Might just be a spoof objecct

        this.debug = options.debug
        this.manager = options.manager

        // Specify File Path
        this.directory = options.directory ?? ''
        this.path = options.path // Optional

        this.method = (file.origin && file.path) ? 'remote' : 'local' // 'remote'
        // this.edited = false

        if (this.method === 'remote') {
            this.remote = file
            const split = file.path.split('/')
            file.name = split[split.length - 1]
            this.options = file.options
            this.type = null // No types provided // TODO: Get this from a file header
        }

        this.loadFileInfo(this.file)

        this.storage = {}
        this[`#original`] = undefined
    }

    createFile = async (buffer, oldFile = this.file, createInSystem = false) => {
        let newFile = new Blob([buffer], oldFile) // Create an object that is recognized as a file

        // Add File Metadata
        newFile.lastModified = oldFile.lastModified
        newFile.lastModifiedDate = oldFile.lastModifiedDate
        newFile.name = oldFile.name

        newFile.webkitRelativePath = oldFile.webkitRelativePath || `${this.directory}/${this.path || this.name}`

        // Create File in System
        if (createInSystem && !this.fileSystemHandle) this.fileSystemHandle = await this.parent.getFileHandle(this.name, { create: true });

        return newFile
    }

    loadFileInfo = (file) => {

        // Get File Information
        this.name = file.name
        this.type = file.type
        const { mimeType, zipped, extension } = getInfo(file)
        this.mimeType = mimeType
        this.zipped = zipped
        this.extension = extension
    }


    init = async () => {

        // Get File from Handle
        if (this.fileSystemHandle === this.file) {
            this.file = await this.fileSystemHandle.getFile()
            this.loadFileInfo(this.file)
        }

        // Only Load Buffer for Local Mode
        if (this.method === 'local') {

            let converted = false
            // Convert File Spoofs to a Blob
            if (!(this.file instanceof Blob)) { // Catches files and blobs
                const buffer = await this.set(this.file.data) // Load the file data
                this.file = await this.createFile(buffer)
                converted = true
            }

            this.storage = await getFileData(this.file).catch(this.onError)

            // Always Convert File to Blob Spoof
            if (!converted) this.file = await this.createFile(this.storage.buffer)
        }


        this.config = this.manager.extensions?.[this.mimeType]?.config
        await this.setupByteGetters()

    }

    get = async () => {
        // Re-Encode to a Buffer
        try {

            // Decode Buffer into Cache
            if (!this[`#body`]) {
                const ticDecode = performance.now()
                this[`#body`] = await this.manager.decode(this.storage, this.file).catch(this.onError)
                const tocDecode = performance.now()
                if (this.debug) console.warn(`Time to Decode (${this.name}): ${tocDecode - ticDecode}ms`)
            }

            // Track Original Object
            if (!this['#original']) {

                const tic = performance.now()
                if (isClass(this['#body'])) {
                    this[`#original`] = this[`#body`]
                    console.warn('Will not deep clone file bodies that are class instances')
                } else if (this.config){
                    this[`#original`] = this[`#body`]
                    console.warn('Will not stringify bodies that support range requests.')
                } else {
                    try {
                        this[`#original`] = JSON.parse(JSON.stringify(this[`#body`]))
                    } catch (e) {
                        this[`#original`] = this[`#body`]
                        console.warn('Could not deep clone', e)
                    }
                }

                const toc = performance.now()
                if (this.debug) console.warn(`Time to Deep Clone (${this.name}): ${toc - tic}ms`)
            }

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
            if (this.debug) console.warn(`Time to Encode (${this.name}): ${tocEncode - ticEncode}ms`)

            // Reset Cache
            this[`#body`] = o
            return this.storage.buffer
        } catch (e) {
            console.error('Could not encode as a buffer', o, this.mimeType, this.zipped)
            this.onError(e)
        }
    }



    getBuffer = async () => {
        if (this[`#body`] !== this[`#original`]) return this.sync()
        return this.storage.buffer
    }

    sync = async (createInSystem) => {

        if (this[`#body`] !== this[`#original`]){
            if (!this.config){
                console.warn(`Synching file contents with buffer (${this.name})`, this[`#body`], this[`#original`])
                const buffer = await this.set(this[`#body`]) // Re-encode cache data
                this.file = await this.createFile(buffer, this.file, createInSystem) // Create file in system if it doesn't exist
            } else console.warn(`Write access is disabled for RangeFile with range-gettable properties (${this.name})`)
        }
        return this.file
    }

    save = async () => {
        const file = await this.sync(true)
        if (this.fileSystemHandle.size == file.size) return // Skip files which are already complete
        const writable = await this.fileSystemHandle.createWritable()
        const stream = file.stream() // Stream the whole file (???)
        await stream.pipeTo(writable)
    }

    onError = (e) => {
        console.error(e)
    }

    // -------------------- Range Request Support --------------------
    getFromBytes = async (key, property = this.config.properties[key], parent, i) => {

        if (property) {

            let start = await this.getProperty(property.start, parent, i)
            const length = await this.getProperty(property.length, parent, i)

            // Asynchronous
            let bytes = []
            if (this.method === 'remote') bytes = await this.getRemote({ key, start, length }).catch(console.error)

            // Synchronous
            else {

                let tempBytes = []
                if (!Array.isArray(start)) start = [start]
                start.forEach(i => tempBytes.push(this.storage.buffer.slice(i, i + length)))

                // Merge Arrays
                const totalLen = tempBytes.reduce((a,b) => a + b.length, 0)

                const tic = performance.now()
                let offset = 0
                bytes = new Uint8Array(totalLen);
                tempBytes.forEach(arr => {
                    bytes.set(arr, offset);
                    offset += arr.length
                })
                const toc = performance.now()
                if (this.debug && start.length > 1) console.warn(`Time to merge arrays (${this.name}): ${toc-tic}ms`)
            }


            let output = (property.ignoreGlobalPostprocess) ? bytes : this.config.preprocess(bytes)
            if (property.postprocess instanceof Function) output = await property.postprocess(output, this['#body'], i)

            return output

        } else {
            console.warn(`No getter for ${key}`)
        }
    }

    getProperty = async (property, parent, i) => {
        if (property instanceof Function) {
            try {
                return property(this['#body'], parent, i).catch(e => console.error(e))
            } catch {
                return property(this['#body'], parent, i)
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

            this['#body'][key] = []

            const n = await this.getProperty(property.n, property)

            for (let i = 0; i < n; i++) {
                const value = {}
                Object.defineProperty(value, 'n', { get: () => n }) // Track n
                for (let prop in property.properties) {
                    await this.defineProperty(prop, property.properties[prop], value, i)
                }
                this['#body'][key].push(value)
            }
        }
    }


    setupByteGetters = async () => {


        // Define Body Properties
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

        // Hijack Body to Provide Gettable Properties
        if (this.config) {
            this[`#body`] = {}
            for (let key in this.config.properties) await this.defineProperty(key, this.config.properties[key], this['#body'])
            if (this.config.metadata instanceof Function) await this.config.metadata(this['#body'], this.config)
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
            }

            // Set Headers
            options.headers = Object.assign({ Range }, options.headers)
            const buffer = await request(`${this.remote.origin}/${this.file.path}`, options)
            return buffer
        }
    }
}