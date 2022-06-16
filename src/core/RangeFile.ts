
import { isClass } from './utils/classes'
import { fetchRemote } from './remote/request'
import { FileConfig, BlobFile, MethodType, RemoteFileType } from './types/index'
import { RangeConfig, MimimumRangeInfo } from './types/range'
import encode from './encode'
import {get} from './info'
import decode from './decode'
import transfer from './transfer'
import * as defaults from './extensions'
import * as path from './utils/path'
import System from './System'
import extend from './extend'

const useRawArrayBuffer = ['nii', 'nwb'] // TODO: Handle this within extensions

export type FileSpoof = {
    data: any,
    type: any,
    lastModified: File['lastModified'],
    name: File['name']
    webkitRelativePath: File['webkitRelativePath']
}

export default class RangeFile {

    // Main File Argument
    file?: BlobFile | FileSpoof // File | BlobFile | FileSystemFileHandle | FileSpoof
    fileSystemHandle?: FileSystemFileHandle

    // File Configuration Options
    directory: FileConfig['directory']
    path: FileConfig['path']
    parent: FileConfig['parent']
    debug: FileConfig['debug']

    registry: any;
    loaders: any;

    // File Derived Information
    name: string
    type: string
    mimeType: string;
    zipped: boolean;
    extension: string;

    rangeConfig?: RangeConfig = null;
    rangeSupported: boolean = false;


    method: MethodType
    remote?: RemoteFileType
    remoteOptions?: RemoteFileType['options']
    storage: {
        buffer?: ArrayBuffer | Uint8Array,
        file?: BlobFile
    }

    body: Promise<any>;
    [`#body`]: any;
    [`#original`]: any;

    config: FileConfig
    system: System
    
    constructor(file, options: FileConfig) {

        // Where To Save
        if (file instanceof FileSystemFileHandle) {
            this.fileSystemHandle = file
        } else this.file = file // Might just be a spoof object

        this.config = options

        if (options.parent) this.parent =  options.parent // Parent in the filesystem

        this.debug = options.debug

        // Populate Loaders
        const loaders = options?.loaders ?? {}
        this.registry = Object.assign({}, defaults.registry) // Clone
        this.loaders = Object.assign({}, defaults.extensions) // Clone
        for (let name in loaders) extend(loaders[name], this.loaders, this.registry)

        // File Metadata
        this.system = options.system
        this.path = options.path // Optional


        this.method = (file.origin != undefined && file.path != undefined) ? 'remote' : 'native'
        // this.edited = false

        if (this.method === 'remote') {
            this.remote = file
            const split = file.path.split('/')
            file.name = split[split.length - 1]
            this.remoteOptions = file.options
            this.type = null // No types provided // TODO: Get this from a file header
        }

        if (this.file) this.loadFileInfo(this.file)

        this.storage = {}
        this.rangeSupported = false
        this[`#original`] = undefined
    }

    createFile = async (buffer, oldFile = this.file, create = false) => {
        let newFile = new Blob([buffer], oldFile) as BlobFile// Create an object that is recognized as a file

        // Add File Metadata
        newFile.lastModified = oldFile.lastModified
        newFile.name = oldFile.name

        newFile.webkitRelativePath = oldFile.webkitRelativePath || `${this.system.root}/${this.path || this.name}`

        // Create File in System
        if (create && !this.fileSystemHandle) {
            if (!this.parent) {
                console.warn(`Directory for file ${this.path} does not exist. Choosing a filesystem to mount...`);
                await transfer(this.system)
                return
            } else this.fileSystemHandle = await this.parent.getFileHandle(this.name, { create: true });
        }

        return newFile
    }

    loadFileInfo = (file=this.file) => {
        if (file) {

            // Get File Information
            this.name = file.name
            this.type = file.type
            const { mimeType, zipped, extension } = get(file, this.registry)
            this.mimeType = mimeType
            this.zipped = zipped
            this.extension = extension
        } else console.warn('Valid file object not provided...')
    }


    init = async () => {

        // Get File from Handle
        if (!this.file && this.fileSystemHandle) {
            this.file = await this.fileSystemHandle.getFile()
            this.loadFileInfo(this.file)
        }

        // Check Handler for Extension Config
        const loader = this.loaders[this.mimeType]
        const rangeConfig = loader?.config
        if (rangeConfig) this.rangeConfig = rangeConfig
        else {
            // console.log(this)
            if (!loader) console.warn(`Cannot find a configuration file for ${this.path}. Provide the correct loader to a FileHandler instance.`)
        }

        this.rangeSupported = !!this.rangeConfig 

        // Only Load Buffer for Local Mode
        let converted = false
        if (this.method === 'native') {
            // Convert File Spoofs to a Blob
            if (!(this.file instanceof Blob)) { // Catches files and blobs
                this.set(this.file.data) // Load the file data
                await this.sync()
                converted = true
            }

            this.storage = await this.getFileData().catch(this.onError)

            // Always Convert File to Blob Spoof
            if (!converted) {
                if (this.storage?.buffer) this.file = await this.createFile(this.storage.buffer)
                else if (this.debug) console.warn(`No buffer created for ${this.path}...`)
            }
        }


        await this.setupByteGetters()

    }

    setOriginal = () => {
        const tic = performance.now()
        if (this.rangeSupported){
            this[`#original`] = null //this[`#body`]
            if (this.debug) console.warn('Will not stringify bodies that support range requests.')
        } else if (isClass(this['#body'])) {
            this[`#original`] = null; //this[`#body`]
            if (this.debug) console.warn('Will not deep clone file bodies that are class instances')
        } else {
            try {
                if (typeof this[`#body`] === 'object') this[`#original`] = JSON.parse(JSON.stringify(this[`#body`]));
                else this[`#original`] = this[`#body`]
            } catch (e) {
                this[`#original`] = null //this[`#body`]
                if (this.debug) console.warn('Could not deep clone', e)
            }
        }

        const toc = performance.now()
        if (this.debug) console.warn(`Time to Deep Clone (${this.path}): ${toc - tic}ms`)
    }

    get = async () => {
        // Re-Encode to a Buffer
        try {

            // Decode Buffer into Cache
            if (!this[`#body`]) {
                const ticDecode = performance.now()
                const storageExists = Object.keys(this.storage).length > 0

                if (!storageExists && !this.rangeSupported) this.storage = await this.getFileData() // Get Remote File Data (if range requests are not supported...)

                this[`#body`] = await decode(this.storage, this.file, this.config, undefined, this.loaders, this.registry).catch(this.onError)
                const tocDecode = performance.now()
                if (this.debug) console.warn(`Time to Decode (${this.path}): ${tocDecode - ticDecode}ms`)
            }

            // Track Original Object
            if (this['#original'] === undefined) this.setOriginal()

            // Return Cache
            return this[`#body`]
        } catch (e) {
            const msg = `Decoder failed for ${this.path} - ${this.type || 'No file type recognized'}`
            if (this.debug) console.warn(msg, e)
            return {}
        }
    }

    set = (o) => this[`#body`] = o

    sync = async (force=!(this.file instanceof Blob), create=undefined) => {

        if (this.rangeSupported) {
            if (this.debug) console.warn(`Write access is disabled for RangeFile with range-gettable properties (${this.path})`)
            return true
        } else {

            const bodyString = JSON.stringify(this[`#body`])
            const ogString = JSON.stringify(this[`#original`])
            const different = bodyString !== ogString

            // Check Equivalence
            if (force || different){
                if (this.debug) console.warn(`Synching file contents with buffer (${this.path})`, (different) ? `${ogString} > ${bodyString}`: bodyString)
                    
                    // Encode New Object
                    const toEncode = this[`#body`] ?? '' // Do not encode undefined values
                    try {
                        const ticEncode = performance.now()
                        this.storage.buffer = await encode(toEncode, this.file,  this.config, undefined, this.loaders, this.registry)//.catch(this.onError)
                        const tocEncode = performance.now()
                        if (this.debug) console.warn(`Time to Encode (${this.path}): ${tocEncode - ticEncode}ms`)
                    } catch (e) {
                        console.error('Could not encode as a buffer', toEncode, this.mimeType, this.zipped)
                        this.onError(e)
                    }

                    // Create New File
                    const newFile = await this.createFile(this.storage.buffer, this.file, create) // Create file in system if it doesn't exist
                    if (newFile) this.file = newFile
                    else {
                        if (this.debug) console.warn(`New file not created for ${this.path}`)
                        return
                    }

                    // Start Tracking Original File Again
                    this.setOriginal()

                    return this.file

            } else return true
        }
    }

    // Always Force Save Remote Files
    save = async (force=!!this.remote) => {
        const file = await this.sync(force, true)

        if (file instanceof Blob){
            const writable = await this.fileSystemHandle.createWritable()
            const stream = (file as any).stream() as ReadableStream // ASSUMPTION: Stream the whole file (???)
            const tic = performance.now()
            await stream.pipeTo(writable)
            const toc = performance.now()
            if (this.debug) console.warn(`Time to stream into file (${this.path}): ${toc-tic}ms`)
        }
    }

    onError = (e) => {
        console.error(e)
    }

    // -------------------- Range Request Support --------------------
    getFromBytes = async (key, property = this.rangeConfig.properties[key], parent, i) => {

        if (property) {

            let start = await this.getProperty(property.start, parent, i)
            const length = await this.getProperty(property.length, parent, i)

            // Asynchronous
            let bytes = new Uint8Array();
            if (this.method === 'remote') {
                bytes = await this.getRemote({ start, length })
            // Synchronous
            } else {

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
                if (this.debug && start.length > 1) console.warn(`Time to merge arrays (${this.path}): ${toc-tic}ms`)
            }

            const tic = performance.now()
            let output = (property.ignoreGlobalPostprocess) ? bytes : this.rangeConfig.preprocess(bytes)
            if (property.postprocess instanceof Function) output = await property.postprocess(output, this['#body'], i)
            const toc = performance.now()
            if (this.debug) console.warn(`Time to postprocess bytes (${this.path}, ${key}, ${start}-${start+length}): ${toc-tic}ms`)
            return output

        } else {
            if (this.debug) console.warn(`No getter for ${key}`)
        }
    }

    getProperty = async (property, parent, i=undefined) => {
        if (property instanceof Function) {
            try {
                return property(this['#body'], parent, i).catch(e => console.error(e))
            } catch {
                return property(this['#body'], parent, i)
            }
        } else return property
    }

    defineProperty = async (key, property, parent, i=undefined) => {

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
                set: (o) => this.set(o)
            },
            [`#body`]: {
                writable: true,
                enumerable: false
            }
        })

        // Hijack Body to Provide Gettable Properties
        if (this.rangeSupported) {
            this[`#body`] = {}
            for (let key in this.rangeConfig.properties) await this.defineProperty(key, this.rangeConfig.properties[key], this['#body'])
            if (this.rangeConfig.metadata instanceof Function) await this.rangeConfig.metadata(this['#body'], this.rangeConfig)
        }

    }


    // -------------------- Remote Support --------------------

    getRemote = async (property: Partial<MimimumRangeInfo>={}) => {

        let { start, length } = property
        const options = Object.assign({}, this.remoteOptions)
        if (!Array.isArray(start)) start = [start]

        if (start.length < 1) return new Uint8Array() // Ignore empty start array
        else {

            // Define Range if Specified
            const isDefined = start[0] != undefined
            if (isDefined){
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

            }

            const o = await fetchRemote(path.get(this.remote.path, this.remote.origin), options)
            return o.buffer
        }
    }

    getFileData = () => {

    // ----------------- Use Decoders -----------------
    return new Promise(async (resolve, reject) => {

            // Handle Remote Files
            if (this.method === 'remote'){
                const buffer = await this.getRemote()
                this.file = await this.createFile(buffer) // Create a file object locally
                resolve({file: this.file, buffer})
            } 
            
            // Handle Local Files
            else {

            const reader = new FileReader()
            const methods = {
                'dataurl': 'readAsDataURL',
                'buffer': 'readAsArrayBuffer'
            }

            let method = 'buffer'
            if (this.file.type && (this.file.type.includes('image/') || this.file.type.includes('video/'))) method = 'dataurl'
            
            reader.onloadend = e => {

                if (e.target.readyState == FileReader.DONE) {
                    if (!e.target.result) return reject(`No result returned using the ${method} method on ${this.file.name}`)

                    let data = e.target.result
                    if ((data['byteLength'] ?? data['length']) === 0) {
                        if (this.debug) console.warn(`${this.file.name} appears to be empty`)
                        resolve({file: this.file, [method]: new Uint8Array()})
                    }
                    else if (data instanceof ArrayBuffer && !useRawArrayBuffer.includes(this.extension)) data = new Uint8Array(data) // Keep .nii files as raw ArrayBuffer
                    resolve({file: this.file, [method]: data})
                } 

                // No Data
                else if (e.target.readyState == FileReader.EMPTY) {
                    if (this.debug) console.warn(`${this.file.name} is empty`)
                    resolve({file: this.file, [method]: new Uint8Array()})
                }
            }
            
            reader[methods[method]](this.file)
        }
    })
    }
}