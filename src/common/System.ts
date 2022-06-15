import { RangeFile } from '.'
import { AnyObj, GroupType, PathType, MethodType } from './types'
import deepClone from './utils/clone'
import { load } from './load'
import save from './save'
import iterAsync from './utils/iterate'
import { createFile as createRemoteFile } from './remote'
import { NativeOpenFunction, RemoteOpenFunction, MountMethod, NativeMountResponse, RemoteMountResponse } from './types/open'
import openRemote from './remote/open'
import mountRemote from './remote/mount'
import open from './open'
import * as info from './info'
import * as url from './utils/url'
import * as pathUtils from './utils/path'
import { ProgressCallbackType } from './types/config'

type Group = {[x:string]: GroupType}
type ConditionType = (info:any) => boolean

type SystemInfo = {
    native?: FileSystemDirectoryHandle
    ignore?: string[]
    debug?: boolean,
    writable?: boolean
}

export default class System {

    name: string
    root: string

    writable: boolean

    changelog: RangeFile[] = []
    native: SystemInfo['native']
    files?: {

        // Default Groupings
        system?: {
            [x:string]: AnyObj | RangeFile // Nested RangeFiles
        },
        types?: {[x:string]: RangeFile[]}
        n?: number,
        list?: Map<PathType, RangeFile>

        // Arbitrary Groupings
    } & AnyObj = {}


    // Controls
    ignore: SystemInfo['ignore']
    debug: SystemInfo['debug']

    // Files Organization
    groups: Group = {}
    groupConditions: Set<Function> = new Set()


    constructor(name?: string, systemInfo: SystemInfo = {}) {
        this.name = name
        this.native = systemInfo.native
        this.debug = systemInfo.debug
        this.ignore = systemInfo.ignore ?? []

        this.writable = systemInfo.writable

                // -------------- Default Groupings --------------
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
        this.addGroup('n', 0, (_, __, files) => files.n++)

        // keep a list of files
        this.addGroup('list', new Map(), (file, _, files) => files.list.set(file.path, file))

    }

    progress?: ProgressCallbackType

    init = async () => {

        // -------------- Default to Mount Native --------------
        if (this.isNative(this.name)){
            const native = await this.mountNative()
            if (native){
                this.native = native
                this.name = this.native.name
            } else console.error('Unable to mount native filesystem!')
        }

        // -------------- Set Native Info --------------
        if (this.native) this.root = this.name 

        // -------------- Set Remote Info --------------
        else {

            const path = this.name
            const isURL = url.isURL(path)
            const fileName = info.name(path)

            if (isURL){

                // Case #1: Single File (including esm)
                if (fileName) {
                    const path = this.name
                    this.root = info.directory(path)
                    const file = await this.open(fileName) // Open the file
                    await file.body // Load file body immediately
                } 

                // Case #2: Freerange System
                else {
                    const root = await this.mountRemote(this.name, {
                        system: this,
                        progress: this.progress
                    })

                    if (root) this.root = root
                    else console.error('Unable to connect to freerange filesystem!')
                }
            }

            // Case #3: Arbitrary Collection of Remote Files
            else if (this.name) this.root = ''
        }
    }

    addGroup = (name, initial, condition) => {
        this.files[name] = initial // TODO: Ensure this group is added to all mounted filesystems
        this.groups[name] = this.cloneGroup({initial, condition})
        this.groupConditions.add(condition)
    }

    cloneGroup = (o) => {
        let newO: Partial<GroupType> = {condition: o.condition} // Pass condition
        if (o.initial instanceof Map) newO.initial = new Map(o.initial)
        else newO.initial = deepClone(o.initial);
        return newO as GroupType
    }

    subsystem = async (path) => {
        const files = this.createFileSystemInfo()
        const split = path.split('/')
        const name = split[split.length - 1]
        const subDir = split.shift()
        path = split.join('/') // Path without directory name

        let target = this.files.system[subDir]
        split.forEach(str => target = target[str])

        const system = new System(name)
        await system.init()

        let drill = async (target, base) => {
            for (let key in target) {
                const newBase = (base) ? base + '/' + key : key
                const file = target[key]
                if (file instanceof RangeFile) await system.load(file, newBase)
                else await drill(file, newBase)
            }
        }

        await drill(target, path)
        return files
    }

    reset = () => {
        this.changelog = []
        this.files = this.createFileSystemInfo()
    }

    createFileSystemInfo = () => {
        const files = {}
        for (let name in this.groups) {
            let group = this.groups[name]
            const groupInfo = this.cloneGroup(group)
            files[name] = groupInfo.initial
        }
        return files
    }

    checkToLoad = (name) => {
        return this.ignore.reduce((a, b) => a * (name?.includes(b) ? 0 : 1), 1)
    }

    load = async (file, path: PathType) => {

        const existingFile = this.files.list.get(path)
        if (existingFile) return existingFile
        else {

            // Convert to Remote File
            if (!file.name) file.name = info.name(path) // Default name
            if (!this.native) file = createRemoteFile(file, path, this)

            // Check to Load
            const toLoad = this.checkToLoad(file.name ?? file.path ?? path)
            if (toLoad) {
            
                // Use Library Load Function
                return await load(file, {
                    path,
                    system: this,
                    debug: this.debug,
                })            
            } else console.warn(`Ignoring ${file.name}`)
        }
    }

    add = (file: RangeFile) => {
         
        // Add file to changelog
        // if (!(file.method === 'remote') && !(file instanceof FileSystemFileHandle)) this.changelog.push(file)

        // // Overwrite Existing Files
        if (!this.files.list.has(file.path)) {
            //     console.warn(`Overwriting existing ${file.path} file`); // TODO: Overwrite all other entries too...
            //     this.files.list.delete(file.path);

            // Add File to Groups
            this.groupConditions.forEach(func => func(file, file.path, this.files))
        } else console.warn(`${this.name}/${file.path} already exists!`)

}


isNative: ConditionType = () => false // Always remote file

// ------------ Default Open Methods ------------
openNative: NativeOpenFunction;
openRemote: RemoteOpenFunction = openRemote

mountNative: MountMethod<NativeMountResponse>;
mountRemote: MountMethod<RemoteMountResponse>  = mountRemote


// ------------ Core Open Method (with path update) ------------
open = async (path) => {
    if (!this.native) path = pathUtils.get(path, this.root) // Append root on remote
    return await open(path, { 
        debug: this.debug, 
        system: this,
        create: this.writable
    })
}

// ------------ Core Save Method ------------
save = async (force, progress:ProgressCallbackType = this.progress) => await save(this.name, Array.from(this.files.list.values()), force, progress)

// ------------ RangeFile Sync Method ------------
sync = async () => await iterAsync(Array.from(this.files.list.values()), async entry => await entry.sync())

}