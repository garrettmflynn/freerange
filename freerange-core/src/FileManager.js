import request from './request.js'

import { get, set } from 'idb-keyval';
import RangeFile from './RangeFile.js'
import { objToString } from './utils/parse.utils.js'
import FileHandler from '../../common/FileHandler';

export default class FileManager extends FileHandler {
    constructor(options = {}) {
        super(options)
        this.native = null
        this.ignore = options.ignore ?? []
        this.directoryCacheName = 'freerangeCache'
        this.directoryName = ''
        this.groupConditions = new Set()

        // Default Groups
        this.addDefaultGroups()

        // Initialize File System
        this.reset()
    }

    createFileSystemInfo = () => {
        return {
            system: {},
            types: {},
            list: [],
            n: 0
        }
    }

    reset = () => {
        this.changelog = []
        this.files = this.createFileSystemInfo()
    }

    get = async (file, options = {}) => {
        if (!options.directory) options.directory = this.directoryName
        const rangeFile = new RangeFile(file, Object.assign({ manager: this, debug: this.debug }, options))
        await rangeFile.init()
        return rangeFile
    }

    // --------------- Place Files into the System --------------- 
    toLoad = (name) => {
        return this.ignore.reduce((a, b) => a * !name.includes(b), true)
    }

    load = async (file, options={}) => {

        let path = options.path
        const files = options.files ?? this.files

        const toLoad = this.toLoad(file.name ?? file.path)

        if (toLoad) {

            // Get Path to File
            if (!path) path = file.webkitRelativePath ?? file.relativePath ?? file.path ?? ''

            const fileOptions = { path, directory: this.directoryName }

            if (!(file instanceof RangeFile)) {

                    let addToLog;

                    // Local Files Only
                    if (!('origin' in file)) {
                        if (!(file instanceof FileSystemFileHandle)) {
                            const pathWithoutName = path.split('/').slice(0, -1).join('/')
                            fileOptions.parent = await this.open(pathWithoutName, 'directory', false) // Don't create file
                            addToLog = true
                        }
                    }

                    file = await this.get(file, fileOptions)
                    if (addToLog) this.changelog.push(file) // Add file to changelog
            }

            this.groupConditions.forEach(func => func(file, files))
            return file
        } else console.warn(`Ignoring ${file.name}`)
    }

    addGroup = (condition) => {
        this.groupConditions.add(condition)
    }

    addDefaultGroups = () => {

        // file system
        this.addGroup((file, files) => {
            let target = files.system
            let split = file.path.split('/')
            split = split.slice(0, split.length - 1)
            if (file.path) split.forEach((k, i) => {
                if (!target[k]) target[k] = {}
                target = target[k]
            })
            target[file.name] = file
        })

        // file type
        this.addGroup((file, files) => {
            const extension = file.extension ?? file.name
            if (extension) {
                if (!files.types[extension]) files.types[extension] = []
                files.types[extension].push(file)
            } // e.g. README, CHANGES
        })

        // keep track of file count
        this.addGroup((_, files) => {
            files.n++
        })

        // keep a list of files
        this.addGroup((file, files) => {
            files.list.push(file)
        })
    }

    // --------------- Handle Remote File System --------------- 
    request = request

    // --------------- Load Local Files --------------- 
    // https://web.dev/file-system-access/#stored-file-or-directory-handles-and-permissions

    verifyPermission = async (fileHandle, withWrite) => {
        const opts = {};
        if (withWrite) opts.mode = 'readwrite';

        const state = await fileHandle.queryPermission(opts)
        if (await state === 'granted') return true; // Check if we already have permission, if so, return true.

        const requestState = await fileHandle.requestPermission(opts)
        if (requestState === 'granted') return true;  // Request permission to the file, if the user grants permission, return true.

        return false; // The user did not grant permission, return false.
    }

    mountCache = async (progressCallback) => {
        let dirHandle = await get(this.directoryCacheName);
        if (dirHandle) {
            console.log(`Loaded cached mount "${dirHandle.name}" from IndexedDB.`)
            return await this.mount(dirHandle, progressCallback)
        }
        else return // Nothing in the cache
    }

    getSubsystem = async (path) => {

        const files = this.createFileSystemInfo()
        const split = path.split('/')
        const subDir = split.shift()
        path = split.join('/') // Path without directory name
        let target = this.files.system[subDir]
        split.forEach(str => target = target[str])
        let drill = async (target, base) => {
            for (let key in target) {
                const newBase = (base) ? base + '/' + key : key
                const file = target[key]
                if (file instanceof RangeFile) await this.load(file, { path: newBase, files })
                else await drill(file, newBase)
            }
        }

        await drill(target, path)
        return files
    }

    mount = async (fileSystemInfo, progressCallback) => {

        this.reset() // Clear existing file system

        if (!fileSystemInfo) fileSystemInfo = await window.showDirectoryPicker();
        await set(this.directoryCacheName, fileSystemInfo); // Saving file system info (of all types)

        // -------- File System Access API --------
        if (fileSystemInfo instanceof FileSystemDirectoryHandle) {
            await this.createLocalFilesystem(fileSystemInfo, progressCallback)
        }

        // -------- Remote Filesystem --------
        else if (typeof fileSystemInfo === 'string') {

            this.directoryName = fileSystemInfo
            await this.request(fileSystemInfo, { mode: 'cors' }, progressCallback)
                .then(o => {

                    // Expose Files from the freerange FileSystem...
                    if (o.type === 'application/json') {
                        const datasets = JSON.parse(new TextDecoder().decode(o.buffer))

                        const drill = (o) => {
                            for (let key in o) {
                                const target = o[key]

                                const toLoad = this.toLoad(key)
                                if (toLoad) {
                                    if (typeof target === 'string') {
                                        const file = {
                                            origin: this.directoryName,
                                            path: target,
                                            options: {
                                                mode: 'cors' // Always enable CORS
                                            }
                                        }
                                        this.load(file)
                                    }
                                    else drill(target)
                                }
                            }
                        }

                        drill(datasets)
                    } 
                    
                    // Import JS Files Accessed Remotely (from anywhere...)
                    else {
                        let fileText = new TextDecoder().decode(o.buffer)
                        console.log(fileText)
                    }

                }).catch(e => {
                    console.error('File System Load Error', e)
                })
        }

        // -------- File (default) --------
        else await this.load(fileSystemInfo)

        return this.files
    }


    // Iterate Asynchronously Through a Collection
    iterAsync = async (iterable, asyncCallback) => {
        const promises = [];
        let i = 0
        for await (const entry of iterable) {
            promises.push(asyncCallback(entry, i));
            i++
        }
        const arr = await Promise.all(promises)
        return arr
    }

    onhandle = async (handle, base = '', progressCallback) => {

        await this.verifyPermission(handle)

        // Skip Directory Name in the Base String
        if (handle.name != this.directoryName) base = (base) ? `${base}/${handle.name}` : handle.name

        const files = []
        if (handle.kind === 'file') {
            if (progressCallback instanceof Function) files.push({ handle, base }) // Add file details to an iterable
            else await this.load(handle, { path: base }) // Load file immediately
        } else if (handle.kind === 'directory') {

            const toLoad = this.toLoad(handle.name)
            if (toLoad) {
                const arr = await this.iterAsync(handle.values(), (entry) => {
                    return this.onhandle(entry, base, progressCallback)
                })
                files.push(...arr.flat())
            }
        }


        // Iterate through Entire File List (of known length) 
        // Note: Only if callback is a function
        if (!base) {
            let count = 0
            await this.iterAsync(files, async (o) => {
                await this.load(o.handle, { path: o.base })
                count++
                progressCallback(this.directoryName, count / files.length, files.length)
            })
        }

        return files
    }

    createLocalFilesystem = async (handle, progressCallback) => {
        this.directoryName = handle.name
        this.native = handle
        await this.onhandle(handle, null, progressCallback)
    }

    sync = async () => {
        return await this.iterAsync(this.files.list, async entry => await entry.sync())
    }

    save = (progressCallback) => {
        return new Promise(async (resolve, reject) => {
            let i = 0

            await this.iterAsync(this.files.list, async (rangeFile, j) => {
                await rangeFile.save()
                i++
                if (progressCallback instanceof Function) progressCallback(this.directoryName, i / this.files.list.length, this.files.list.length)
            })
            this.changelog = [] // Reset changelog
            resolve()
        })
    }


    // --------------- Unused File Callbacks --------------- 
    dragHandler = async (e) => {
        e.preventDefault();

        const fileHandlesPromises = [...e.dataTransfer.items]
            .filter((item) => item.kind === 'file')
            .map((item) => item.getAsFileSystemHandle());

        for await (const handle of fileHandlesPromises) {
            this.createLocalFilesystem(handle)
        }
    }

    delete = async (name, parent) => {
        return await parent.removeEntry(name, { recursive: true });
        // OR await directoryHandle.remove();
    }

    rename = async (name) => {
        return await file.move(name);
    }

    move = async (directory, name) => {
        return await file.move(directory, name)
    }

    getPath = async (file, parent) => {
        return await parent.resolve(file);
    }

    open = async (path, type, create=true) => {

        if (!this.native) {
            console.error('No native filesystem mounted...')
            return
        }

        let system = this.files.system
        let directoryHandle = this.native
        const pathTokens = path.split('/')
        let dirTokens = pathTokens.slice(0, -1)
        const filename = pathTokens.slice(-1)[0]
        if (type === 'directory') dirTokens = [...dirTokens, filename]

        if (dirTokens.length > 0) {
            for (const token of dirTokens) {

                // Grab Filesystem Handle
                directoryHandle = await directoryHandle.getDirectoryHandle(token, { create: true })

                // Grab Internal System Location
                if (!system[token]) system[token] = {}
                system = system[token]
            }
        }

        if (type === 'directory') return directoryHandle
        else {

            const existingFile = system[filename]
            if (existingFile) return existingFile
            else {
                const fileHandle = directoryHandle.getFileHandle(filename, { create })
                return await this.load(fileHandle)
            }
        }
    }


    getPath = (path, root='') => {
        const dirTokens = root.split('/')
        dirTokens.pop() // remove file name

        const extensionTokens = path.split('/').filter(str => {
            if (str === '..') {
                if (dirTokens.length == 0) console.error('Derived path is going out of the valid filesystem!')
                dirTokens.pop() // Pop off directories
                return false
            } else if (str === '.') return false
            else return true
        })

        const newPath = extensionTokens.join('/')
        return newPath
    }

    // Direct Import of ES6 Modules
    ['#import'] = async (text) => {
        const moduleDataURI = "data:text/javascript;base64," + btoa(text);
        let imported = await import(moduleDataURI)
        if (imported.default && Object.keys(imported).length === 1) imported = imported.default
        return imported
    }


    // Import ES6 Modules (and replace their imports with actual file imports!)
    import = async (file) => {

        let text = await file.body

        try {
            return await this['#import'](text)
        } 
        
        // Catch Nested Imports
        catch (e) {
            
            console.warn(`${file.name} contains ES6 imports. Manually importing these modules...`)

            // Use a Regular Expression to Splice Out the Import Details
            const importInfo = {}
            var re = /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])/g;
            let m;
            do {
                m = re.exec(text)
                if (m == null) m = re.exec(text); // be extra sure (weird bug)
                if (m) {
                    text = text.replace(m[0], ``) // Replace found text
                    // let id = String(Math.floor(Math.random() * 1000000))
                    const variables = m[1].trim().split(',')
                    importInfo[m[3]] = variables // Save variables to path
                    // variables.forEach(str => text = text.replaceAll(`${str}`, `${id}`)) // Assign random ID to the imported variables
                }
            } while (m);

            // Import Files
            for (let path in importInfo){
                const variables = importInfo[path]                
                const correctPath = this.getPath(path, file.path)

                const importFile = await this.open(correctPath, 'file', false)

                // Get That File and Import It
                const imported = await this.import(importFile)
                if (variables.length > 1){
                    variables.forEach(str => {
                        text = `const ${str} = ${objToString(imported[str], false)}\n${text}`
                    })
                } else {
                    text = `const ${variables[0]} = ${objToString(imported, false)}\n${text}`
                }
            }

            const tryImport = await this['#import'](text)
            
            return tryImport
        }
    }
}