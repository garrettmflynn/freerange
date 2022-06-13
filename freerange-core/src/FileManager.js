import request from './request.js'

import { get, set } from 'idb-keyval';
import RangeFile from './RangeFile.js'
import { objToString } from './utils/parse.utils.js'
import FileHandler from './common/FileHandler';

export default class FileManager extends FileHandler {
    constructor(options = {}) {
        super(options)
        this.native = null
        this.ignore = options.ignore ?? []
        this.directoryCacheName = 'freerangeCache'
        this.groupConditions = new Set()
        this.groups = {}

        // Filesystem Registry
        this.mounted = {}
        this.files = {}
        this.changelog = []
        this.directoryName = undefined;

        // Add Default Group Behavior
        this.addDefaultGroups()
    }

    create = (name, native, switchSystem) => {
        const systemInfo = this.reset(name, native) // Create filesystem
        if (switchSystem) this.switch(systemInfo.name) // Switch to this filesystem automatically
        return systemInfo
    }

    switch = (name) => {
        if (name) {
            this.changelog = this.mounted[name].changelog
            this.files = this.mounted[name].files
            this.native = this.mounted[name].native
            this.directoryName = name
            if (this.onswitch instanceof Function) this.onswitch(name, this.files)
        } else console.warn('No name provided for a directory to switch to.')
    }

    onswitch = null // Switch Callback

    reset = (name = this.directoryName, native = this.native) => {
        if (!this.mounted[name]) this.mounted[name] = {}
        this.mounted[name].name = name
        this.mounted[name].changelog = []
        this.mounted[name].files = this.createFileSystemInfo()
        this.mounted[name].native = native // Ensure there is always a native filesystem...
        return this.mounted[name]
    }

    get = async (file, options = {}) => {
        if (!options.directory) options.directory = this.directoryName
        const rangeFile = new RangeFile(file, Object.assign({ manager: this, debug: this.debug }, options))
        await rangeFile.init()
        return rangeFile
    }

    // --------------- Place Files into the System --------------- 
    toLoad = (name) => {
        return this.ignore.reduce((a, b) => a * !name?.includes(b), true)
    }

    load = async (file, options = {}) => {

        let path = options.path
        let type = options.type

        const directory = options.directory ?? options.system.name ?? this.directoryName
        const mounted = this.mounted[directory]
        const files = options.files ?? mounted?.files ?? this.files

        const toLoad = this.toLoad(file.name ?? file.path)

        if (toLoad) {

            // Get Path to File
            if (!path) path = file.webkitRelativePath ?? file.relativePath ?? file.path ?? ''

            const fileOptions = { path, directory }

            if (!(file instanceof RangeFile)) {

                let addToLog;

                // Remote Files
                if (type === 'remote') {
                    const directoryPath = new URL(fileOptions.directory).pathname.split("/");
                    const url = new URL(fileOptions.path);
                    path = file.path = fileOptions.path = url.pathname.split("/").filter((str, i) => directoryPath?.[i] != str).join("/");
                }

                // Local Files
                else {
                    if (!(file instanceof FileSystemFileHandle)) {
                        const pathWithoutName = path.split('/').slice(0, -1).join('/')
                        fileOptions.parent = await this.open(pathWithoutName, mounted, false) // Don't create file
                        addToLog = true
                    }
                }

                file = await this.get(file, fileOptions)
                if (addToLog) this.changelog.push(file) // Add file to changelog
            }

            // Overwrite Existing Files
            if (files.list.has(file.path)) {
                console.warn(`Overwriting existing ${file.path} file`);
                files.list.delete(file.path);
              }

            // Add File to Groups
            this.groupConditions.forEach(func => func(file, path, files))

            return file
        } else console.warn(`Ignoring ${file.name}`)
    }

    createFileSystemInfo = () => {
        const files = {}
        for (let group in this.groups) {
            const groupInfo = this.groups[group]
            if (groupInfo.initial instanceof Map) files[group] =  new Map(groupInfo.initial)
            else files[group] = JSON.parse(JSON.stringify(groupInfo.initial));
        }

        return files
    }

    addGroup = (name, initial, condition) => {
        this.files[name] = initial // TODO: Ensure this group is added to all mounted filesystems
        this.groups[name] = {
            initial,
            condition
        }
        this.groupConditions.add(condition)
    }

    addDefaultGroups = () => {
        
        // file system
        this.addGroup('system', {}, (file, path, files) => {
            let target = files.system
            let split = path.split('/')
            split = split.slice(0, split.length - 1)
            if (path) split.forEach((k, i) => {
                if (!target[k]) target[k] = {}
                target = target[k]
            })
            target[file.name] = file
        })

        // file type
        this.addGroup('types', {}, (file, _, files) => {
            const extension = file.extension ?? file.name
            if (extension) {
                if (!files.types[extension]) files.types[extension] = []
                files.types[extension].push(file)
            } // e.g. README, CHANGES
        })

        // keep track of file count
        this.addGroup('n', 0, (_, __, files) => {
            files.n++
        })

        // keep a list of files
        this.addGroup('list', new Map(), (file, _, files) => {
            files.list.set(file.path, file)
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

    getSubsystem = async (path, systemName=this.directoryName) => {
        const files = this.createFileSystemInfo()
        const split = path.split('/')
        const subDir = split.shift()
        path = split.join('/') // Path without directory name

        const systemInfo = this.mounted[systemName]
        let target = systemInfo.system[subDir]
        split.forEach(str => target = target[str])

        let drill = async (target, base) => {
            for (let key in target) {
                const newBase = (base) ? base + '/' + key : key
                const file = target[key]
                if (file instanceof RangeFile) await this.load(...this.createFileInfo(file, newBase, systemInfo))
                else await drill(file, newBase)
            }
        }

        await drill(target, path)
        return files
    }

    mount = async (fileSystemInfo, switchSystem=true, progressCallback) => {

        if (!fileSystemInfo) fileSystemInfo = await window.showDirectoryPicker();
        await set(this.directoryCacheName, fileSystemInfo); // Saving file system info (of all types)

        let fileSystemName = fileSystemInfo.name;

        // -------- File System Access API --------
        if (fileSystemInfo instanceof FileSystemDirectoryHandle) {
            await this.createLocalFilesystem(fileSystemInfo, progressCallback)
        }

        // -------- Remote Filesystem --------
        else if (typeof fileSystemInfo === 'string') {

            let url
            try {
                url = new URL(fileSystemInfo).href
            } catch {
                url = this.getPath(fileSystemInfo, window.location.href)
            }

            await this.request(url, { mode: 'cors' }, progressCallback)
                .then(async o => {

                    const type = o.type.split(';')[0] // Get mimeType (not fully specified)
                    // Expose Files from the freerange FileSystem...
                    if (type === 'application/json') {
                        this.directoryName = url // Specify full file path
                        const datasets = JSON.parse(new TextDecoder().decode(o.buffer))

                        const drill = (o) => {
                            for (let key in o) {
                                const target = o[key]

                                const toLoad = this.toLoad(key)
                                if (toLoad) {
                                    if (typeof target === 'string') {
                                        const arr = this.createRemoteFileInfo(undefined, `${url}/${target}`)
                                        this.load(...arr)
                                    }
                                    else drill(target)
                                }
                            }
                        }

                        drill(datasets)
                    }

                    // Load a Single Remote File
                    else {
                        const splitURL = url.split("/")
                        const fileName = splitURL.pop();
                        fileSystemName = splitURL.join('/') // base of the filesystem is the directory holding the entrypoint
                        this.create(fileSystemName);
                        const blob = new Blob([o.buffer], { type });
                        blob.name = fileName;
                        const arr = this.createRemoteFileInfo(blob, url);
                        await this.load(...arr);
                    }

                }).catch(e => {
                    console.error('File System Load Error', e)
                })
        }

        // -------- File (default) --------
        else {

            // TODO: Remove this. One file is not a system
            this.create(fileSystemName)
            await this.load(this.createFileInfo(fileSystemInfo))
        }


        // Switch filesystem if specified by the user (or the first mounted...)
        if (Object.keys(this.mounted).length === 1) switchSystem = true
        if (switchSystem) this.switch(fileSystemName) 
        else console.warn(`FileManager has not globally switched to the ${fileSystemName} filesystem`)
        return this.mounted[fileSystemName]
    }

    createFileInfo = (file = {}, path, system=this.mounted[this.directoryName], type) => {
        if (type === 'remote') return this.createRemoteFileInfo(file, path, system)
        else {
            return [file, { path, system}]
        }
    }
    createRemoteFileInfo = (file = {}, path, system) => {
        const directory = this.directoryName ?? path.split('/').slice(0, -1).join('/')
        
        // Catch System Info
        if (!system) {
            system = this.mounted[directory]
            console.warn(`Got system info for remote files`, system)
        }
        if (!system) system = {}

        file = Object.assign(file, {
            origin: directory,
            path,
            options: {
                mode: 'cors' // Always enable CORS
            }
        })

        let options = {
            type: 'remote',
            directory,
            system
        }

        return [file, options]
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

    onhandle = async (handle, base = '', systemInfo, progressCallback) => {

        await this.verifyPermission(handle)

        // Skip Directory Name in the Base String
        if (handle.name != systemInfo.name) base = (base) ? `${base}/${handle.name}` : handle.name

        const files = []
        if (handle.kind === 'file') {
            if (progressCallback instanceof Function) files.push({ handle, base }) // Add file details to an iterable
            else await this.load(...this.createFileInfo(handle, base, systemInfo)) // Load file immediately
        } else if (handle.kind === 'directory') {

            const toLoad = this.toLoad(handle.name)
            if (toLoad) {
                const arr = await this.iterAsync(handle.values(), (entry) => {
                    return this.onhandle(entry, base, systemInfo, progressCallback)
                })
                files.push(...arr.flat())
            }
        }


        // Iterate through Entire File List (of known length) 
        // Note: Only if callback is a function
        if (!base) {
            let count = 0
            await this.iterAsync(files, async (o) => {
                await this.load(...this.createFileInfo(o.handle, o.base, systemInfo.files))
                count++
                progressCallback(systemInfo.name, count / files.length, files.length)
            })
        }

        return files
    }

    createLocalFilesystem = async (handle, progressCallback) => {
        const systemInfo = this.create(handle.name, handle)
        await this.onhandle(handle, null, systemInfo, progressCallback)
    }

    sync = async (mountedName = this.directoryName) => {
        const files = this.mounted[mountedName].files
        return await this.iterAsync(Array.from(files.list.values()), async entry => await entry.sync())
    }

    save = (mountedName = this.directoryName, force, progressCallback) => {
        return new Promise(async (resolve, reject) => {
            let i = 0

            const files = this.mounted[mountedName].files
            await this.iterAsync(Array.from(files.list.values()), async (rangeFile, j) => {
                await rangeFile.save(force)
                i++
                if (progressCallback instanceof Function) progressCallback(mountedName, i / files.list.size, files.list.size)
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

    // rename = async (name) => {
    //     return await file.move(name);
    // }

    // move = async (directory, name) => {
    //     return await file.move(directory, name)
    // }

    // Move Specified Filesystem to New Local Filesystem
    transfer = async (targetName, toTransfer = this.files) => {
        let transferList = Array.from(toTransfer.list.values()) // Old file list
        if (!targetName) {
            const info = await this.mount(undefined, false); // Mount and Switch
            targetName = info.name
        }

        // Transferring Paths and Parents Between Systems
        await Promise.all(transferList.map(async f => {
            const path = f.path
            const newFile = await this.load(...this.createFileInfo({
                name: f.name,
                data: f[`#body`] // Set file contents on new file
            }, path, this.mounted[targetName])) // Load into selected filesystem
            if (f.method === 'remote') f.parent = newFile.parent // Assign parent if remote file
        }))

        await this.save(targetName, true) // Force new files to save locally
        await this.switch(targetName) // Switch when complete
        return this.mounted[targetName].files // Return new filesystem
    }

    // getPath = async (file, parent) => {
    //     return await parent.resolve(file);
    // }

    open = async (path, systemInfo=this.mounted[this.directoryName], create = true) => {
        let lastHandle = systemInfo.native;

        if (!lastHandle) {
            console.error("No native filesystem mounted...");
            return;
          }
          let system = systemInfo.files.system;
          let pathTokens = path.split("/");
          pathTokens = pathTokens.filter((f) => !!f);
    
          let fileHandle
          if (pathTokens.length > 0) {
            for (const token of pathTokens) {
    
              const handle = await lastHandle.getDirectoryHandle(token, { create: true }).catch(e => {
                const existingFile = system[token];
                if (existingFile) fileHandle = existingFile;
                else fileHandle = directoryHandle.getFileHandle(filename, { create });
              })
    
              if (handle) lastHandle = handle
    
              // Return a File
              if (fileHandle) {
                if (fileHandle instanceof FileSystemDirectoryHandle) return await this.load(...this.createFileSystemInfo(fileHandle));
                else return fileHandle
              } 
              
              // Still a Directory
              else {
                if (!system[token])
                system[token] = {};
              system = system[token];
              }
            }
          }
    
          return lastHandle // Return a Directory
    }


    getPath = (path, ref = '') => {
        const dirTokens = ref.split('/')
        dirTokens.pop() // remove file name

        const extensionTokens = path.split('/').filter(str => {
            if (str === '..') {
                if (dirTokens.length == 0) console.error('Derived path is going out of the valid filesystem!')
                dirTokens.pop() // Pop off directories
                return false
            } else if (str === '.') return false
            else return true
        })


        const newPath = [...dirTokens, ...extensionTokens].join('/')
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

        if (!file) {
            console.error('Improper file passed to import()...')
            return
        } {
            let  text = await file.body

            try {
                return await this['#import'](text)
            }

            // Catch Nested Imports
            catch (e) {

                console.warn(`${file.path} contains ES6 imports. Manually importing these modules...`)

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
                for (let path in importInfo) {

                    // Check If Already Exists
                    let correctPath = this.getPath(path)
                    const variables = importInfo[path];
                    let importFile = this.files.list.get(correctPath)
                    if (!importFile) {
                        const isRemote = file.method === "remote";
                        let basePath = isRemote ? `${file.directory}/${file.path}` : file.path;
                        correctPath = this.getPath(path, basePath);
                        const name = path.split("/").slice(-1)[0];
                        importFile = isRemote ? await this.load(...this.createFileInfo({ name }, correctPath, undefined, file.method)) : await this.open(correctPath);
                    }

                    if (importFile) {
                        const imported = await this.import(importFile);
                        if (variables.length > 1) {
                            variables.forEach((str) => {
                                text = `const ${str} = ${objToString(imported[str], false)}
        ${text}`;
                            });
                        } else {
                            text = `const ${variables[0]} = ${objToString(imported, false)}
        ${text}`;
                        }
                    } else {
                        console.error(`${correctPath} not found. Aborting import...`);
                        return;
                    }
                }

                const tryImport = await this['#import'](text)

                return tryImport
            }
        }
    }
}