
import { isClass } from './utils/classes'
import { fetchRemote } from './system/remote/request'
import { FileConfig, BlobFile, MethodType, RemoteFileType, MimeType, Codec, PathType } from './types/index'
import { RangeConfig, MimimumRangeInfo } from './types/range'
import {get} from './utils/info'
import transfer from './system/core/transfer'
import * as path from './utils/path'
import System from './system/System'
import * as text from './codecs/library/text'
import iterAsync from './utils/iterate'

const useRawArrayBuffer = ['nii', 'nwb'] // TODO: Handle this within extensions

export default class RangeFile {

    // Main File Argument
    file?: BlobFile // File | BlobFile | FileSystemFileHandle
    fileSystemHandle?: FileSystemFileHandle

    // File Configuration Options
    directory: FileConfig['directory']
    path: FileConfig['path']
    debug: FileConfig['debug']

    // File Derived Information
    name: string
    type: string
    mimeType: MimeType;
    zipped: boolean;
    suffix: string;

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
    text: Promise<any>;

    [`#body`]: any;
    [`#originalbody`]: any;
    [`#text`]: any;
    [`#originaltext`]: any;

    config: FileConfig
    system: System

    constructor(file, options: FileConfig) {

        // Where To Save
        if (file.constructor.name === 'FileSystemFileHandle') this.fileSystemHandle = file
        else this.file = file // Might just be a spoof object

        this.config = options

        this.debug = options.debug

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
        this[`#originalbody`] = undefined
        this[`#originaltext`] = undefined
    }


    createFile = async (buffer, oldFile = this.file, create = false) => {
        let newFile = new Blob([buffer], oldFile) as BlobFile// Create an object that is recognized as a file

        // Add File Metadata
        newFile.lastModified = oldFile.lastModified
        newFile.name = oldFile.name

        newFile.webkitRelativePath = oldFile.webkitRelativePath || path.get(this.path || this.name, this.system.root)

        // Create File in System
        if (create && !this.fileSystemHandle) {
            console.warn(`Native file handle for ${this.path} does not exist. Choosing a filesystem to mount...`);
            await transfer(this.system)
            return
        }

        return newFile
    }

    loadFileInfo = (file=this.file) => {
        if (file) {

            // Get File Information
            this.name = file.name
            this.type = file.type
            const { mimeType, zipped, suffix } = get(file.type, file.name, this.system.codecs)
            this.mimeType = mimeType
            this.zipped = zipped
            this.suffix = suffix
        } else console.warn('Valid file object not provided...')
    }


    init = async (file=this.file) => {

        // Get File from Handle
        if (!file && this.fileSystemHandle) {

            file = await this.fileSystemHandle.getFile()
            this.loadFileInfo(file)
        }
        

        // Check Codecs for Codec Config
        const loader = this.system.codecs.get(this.mimeType)
        const rangeConfig = loader?.config
        if (rangeConfig) this.rangeConfig = rangeConfig
        else {
            if (!loader) console.warn(`Cannot find a configuration file for ${this.path}. Please provide the correct codec.`)
        }

        this.rangeSupported = !!this.rangeConfig 

        // Only Load Buffer for Non-Remote Modes
        let converted = false
        if (this.method != 'remote') {

            this.storage = await this.getFileData(file).catch(this.onError)

            // Always Convert File to Blob Spoof
            if (!converted) {
                if (this.storage?.buffer) this.file = await this.createFile(this.storage.buffer)
                else if (this.debug) console.warn(`No buffer created for ${this.path}...`)
            }
        }


        await this.setupByteGetters()

    }

    setOriginal = async (reference='body') => {

        if (this.rangeSupported){
            this[`#original${reference}`] = null 
            if (this.debug) console.warn('Will not stringify bodies that support range requests.')
        } else if (isClass(this[`#${reference}`])) {
            this[`#original${reference}`] = null;
            if (this.debug) console.warn('Will not deep clone file bodies that are class instances')
        } else {
            try {
                const tic = performance.now()
                const value = await this[`#${reference}`] // Get value if not defined
                if (typeof this[`#${reference}`] === 'object') this[`#original${reference}`] = JSON.parse(JSON.stringify(value));
                else this[`#original${reference}`] = value
                const toc = performance.now()
                if (this.debug) console.warn(`Time to Deep Clone (${this.path}): ${toc - tic}ms`)
            } catch (e) {
                this[`#original${reference}`] = null 
                if (this.debug) console.warn('Could not deep clone', e)
            }
        }

    }


    get = async (ref='body', codec?:Codec) => {
        // Re-Encode to a Buffer
        try {

            // Decode Buffer into Cache
            if (!this[`#${ref}`]) {
                const ticDecode = performance.now()
                const storageExists = this.storage.buffer

                if (!storageExists && !this.rangeSupported) this.storage = await this.getFileData() // Get Remote File Data (if range requests are not supported...)
                this[`#${ref}`] = (codec) ? await codec.decode(this.storage, this.config) : await this.system.codecs.decode(this.storage, this.mimeType, this.file.name, this.config).catch(this.onError)
                const tocDecode = performance.now()
                if (this.debug) console.warn(`Time to Decode (${this.path}): ${tocDecode - ticDecode}ms`)
            }

            // Track Original Object
            if (this[`#original${ref}`] === undefined) await this.setOriginal(ref)

            // Return Cache
            return this[`#${ref}`]
        } catch (e) {
            const msg = `Decoder failed for ${this.path} - ${this.mimeType || 'No file type recognized'}`
            if (this.debug) console.warn(msg, e)
            return {}
        }
    }

    set = (val, ref='body') => this[`#${ref}`] = val

    reencode = async (ref="body", codec?: Codec) => {
        
        try {
            const value = await this[`${ref}`] // Read if not read
            const modifiedString = JSON.stringify(value)
            const ogString = JSON.stringify(this[`#original${ref}`])
            const different = modifiedString !== ogString
 
        // Reencode when Different OR With Dependents
        // const dependents = !!this.system.dependents // If Dependents exist
        if (different) {
            
                if (this.debug) console.warn(`Synching file contents with buffer (${this.path})`, (different) ? `${ogString} > ${modifiedString}`: modifiedString)

                // Encode New Object
                const toEncode = value ?? '' // Do not encode undefined values
                try {
                    const ticEncode = performance.now()
                    const buffer = (codec) ? await codec.encode(toEncode, this.config) :  await this.system.codecs.encode(toEncode, this.mimeType, this.file.name,  this.config)//.catch(this.onError)
                    const tocEncode = performance.now()
                    if (this.debug) console.warn(`Time to Encode (${this.path}): ${tocEncode - ticEncode}ms`)
                    return buffer
                } catch (e) {
                    console.error('Could not encode as a buffer', toEncode, this.mimeType, this.zipped, codec)
                    this.onError(e)
                }
        }
        } catch (e) {
            console.warn(e, this[`#${ref}`], this[`#original${ref}`])
        }

    }

    sync = async (force=!(this.file instanceof Blob), create=undefined) => {

        if (this.rangeSupported) {
            if (this.debug) console.warn(`Write access is disabled for RangeFile with range-gettable properties (${this.path})`)
            return true
        } else {

            const bodyEncoded = await this.reencode()
            const textEncoded = await this.reencode('text', text)

            const toSave = bodyEncoded ?? textEncoded

            // Check Equivalence
            if (force || toSave){

                    if (toSave) this.storage.buffer = toSave // Set buffer

                    // Create New File
                    const newFile = await this.createFile(this.storage.buffer, this.file, create) // Create file in system if it doesn't exist

                    if (newFile) this.file = newFile
                    else {
                        if (this.debug) console.warn(`New file not created for ${this.path}`)
                        return
                    }

                    // Start Tracking Original File Information Again
                    if (toSave) {
                        if (textEncoded) this["#body"] = null; // Will recompile the body from buffer
                        if (bodyEncoded) this['#text'] = null // Will recompile the text from buffer
                      } 

                      // Was Forced
                      else {
                        await this.setOriginal();
                        await this.setOriginal("text");
                      }

                    return this.file

            } else return true
        }
    }

    // Always Force Save Remote Files
    save = async (force=!!this.remote) => {

            // Save Self
            const file = await this.sync(force, true)

            if (file instanceof Blob){
                const writable = await this.fileSystemHandle.createWritable()
                const stream = (file as any).stream() as ReadableStream // ASSUMPTION: Stream the whole file (???)
                const tic = performance.now()
                await stream.pipeTo(writable)
                const toc = performance.now()
                if (this.debug) console.warn(`Time to stream into file (${this.path}): ${toc-tic}ms`)
            }

            // Sync Dependents First
            const dependents = this.system.dependents[this.path]
            if (dependents) await iterAsync(dependents.values(), async (f) =>  f['#body'] = null) // Makes the file reload the body / text...
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
            let bytes = new ArrayBuffer(0);
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
                let uBytes = new Uint8Array(totalLen);
                tempBytes.forEach(arr => {
                    uBytes.set(arr, offset);
                    offset += arr.length
                })
                bytes = uBytes
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
        if (!('body' in this)){
            Object.defineProperties(this, {
                ['body']: {
                    enumerable: true,
                    get: async () => this.get(),
                    set: (val) => this.set(val)
                },
                [`#body`]: {
                    writable: true,
                    enumerable: false
                }
            })
        }

        // Define File Text Properties
        if (!('text' in this)){
            Object.defineProperties(this, {
                ['text']: {
                    enumerable: true,
                    get: async () => this.get('text', text),
                    set: (val) => this.set(val, 'text')
                },
                [`#text`]: {
                    writable: true,
                    enumerable: false
                }
            })
        }

        this['#body'] = ''
        this['#text'] = ''

        // Hijack Body to Provide Gettable Properties
        if (this.rangeSupported) {
            this[`#body`] = {}
            for (let key in this.rangeConfig.properties) await this.defineProperty(key, this.rangeConfig.properties[key], this['#body'])
            if (this.rangeConfig.metadata instanceof Function) await this.rangeConfig.metadata(this['#body'], this.rangeConfig)
        }

    }

    apply = async (newFile, applyData=true) => {

        // Handle a Transfer
        if (!this.fileSystemHandle) {
            this.fileSystemHandle = newFile.fileSystemHandle // Abort saving for template remote files...
            this.method = 'transferred'
        }

        // Swap Data
        if (applyData) await this.init(newFile.file)

        // Always Clear Body and Text
        this["#body"] = null;
        this["#text"] = null;
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

    // setFromBuffer = async (buffer: ArrayBuffer) => {
    //     this.file = await this.createFile(buffer)
    //     this.storage = await this.getFileData()
    // }

    getFileData = (file=this.file) => {

    // ----------------- Use Decoders -----------------
    return new Promise(async (resolve, reject) => {

            // ----------- Set RangeFile .file property -----------
            // remote
            if (this.method === 'remote'){
                const buffer = await this.getRemote()
                this.file = file = await this.createFile(buffer) // Create a file object locally
                resolve({file, buffer})
            }
            
            // local
            else {

                this.file = file


            let method = 'buffer'
            if (file.type && (file.type.includes('image/') || file.type.includes('video/'))) method = 'dataurl'
                

            if (globalThis.FREERANGE_NODE){

                // Node Methods
                const methods = {
                    'dataurl': 'dataURL',
                    'buffer': 'arrayBuffer'
                }

                const data = await file[methods[method]]()
                resolve({file, [method]: this.handleData(data)})

            } else { 

                // Browser Methods
                const methods = {
                    'dataurl': 'readAsDataURL',
                    'buffer': 'readAsArrayBuffer'
                }

                const reader = new FileReader()
                reader.onloadend = e => {

                    if (e.target.readyState == FileReader.DONE) {
                        if (!e.target.result) return reject(`No result returned using the ${method} method on ${this.file.name}`)

                        let data = e.target.result
                        resolve({file, [method]: this.handleData(data)})
                    } 

                    // No Data
                    else if (e.target.readyState == FileReader.EMPTY) {
                        if (this.debug) console.warn(`${this.file.name} is empty`)
                        resolve({file, [method]: new Uint8Array()})
                    }
                }
                
                reader[methods[method]](file)
            }
        }
    })
    }

    handleData = (data) => {
        if ((data['byteLength'] ?? data['length']) === 0) {
            if (this.debug) console.warn(`${this.file.name} appears to be empty`)
            return new Uint8Array()
        }
        else if (data instanceof ArrayBuffer && !useRawArrayBuffer.includes(this.suffix)) return new Uint8Array(data) // Keep .nii files as raw ArrayBuffer
        else return data
    }
}