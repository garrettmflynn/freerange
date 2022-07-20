import { AnyObj, GroupType, PathType } from '../types'
import { SystemInfo, Group, ConditionType } from '../types/system'
import { ProgressCallbackType } from '../types/config'

import RangeFile from '../RangeFile'
import deepClone from '../utils/clone'
import { load } from './core/load'
import save from './core/save'
import iterAsync from '../utils/iterate'
import { createFile as createRemoteFile } from './remote'
import { NativeOpenFunction, RemoteOpenFunction, MountMethod, NativeMountResponse, RemoteMountResponse, CombinedOpenConfig } from '../types/open'
import openRemote from './remote/open'
import mountRemote from './remote/mount'
import open from './core/open'
import * as info from '../utils/info'
import * as url from '../utils/url'
import * as pathUtils from '../utils/path'
import Codecs from '../codecs/Codecs'
import * as codecs from '../codecs/index'
import transfer from './core/transfer'

export default class System {

    name: string
    root: string

    writable: boolean
    dependencies:  {[x:string]: Map<PathType, RangeFile>} = {}
    dependents:  {[x:string]: Map<PathType, RangeFile>} =  {}

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
    ignore: SystemInfo['ignore'] = []
    debug: SystemInfo['debug']
    // registry: SystemInfo['registry']
    codecs: Codecs


    // Files Organization
    groups: Group = {}
    groupConditions: Set<Function> = new Set()

    constructor(name?: string, systemInfo: SystemInfo = {}) {

        const info = Object.assign({}, systemInfo)
        this.apply(Object.assign(info, {name}))

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
            const suffix = file.suffix ?? file.name
            if (suffix) {
                if (!files.types[suffix]) files.types[suffix] = []
                files.types[suffix].push(file)
            } // e.g. README, CHANGES
        })

        // keep track of file count
        this.addGroup('n', 0, (_, __, files) => files.n++)

        // keep a list of files
        this.addGroup('list', new Map(), (file, _, files) => files.list.set(file.path, file))

    }

    // Events
    progress?: ProgressCallbackType
    oninit?: Function

    // Initialization
    init = async () => {

        let mountConfig = {
            system: this,
            progress: this.progress
        }

        // -------------- Set Native Info (default) --------------
        if (this.isNative(this.name)){
            const native = await this.mountNative(this.name, mountConfig)  // this.native set internally
            if (!native) console.error('Unable to mount native filesystem!')
            else {
                // Send Directory Handle on Initialization 
                if (this.oninit instanceof Function) this.oninit(native)
            }
        }

        // -------------- Set Remote Info --------------
        else {

            const path = this.name
            const isURL = url.isURL(path)
            const fileName = info.name(path)
            const suffix = info.suffix(path)

            if (isURL){

                // Case #1: Single File (including esm)
                if (fileName && suffix) {
                    const path = this.name
                    this.root = info.directory(path)
                    const file = await this.open(fileName) // Open the file
                    await file.body // Load file body immediately
                } 

                // Case #2: Freerange System
                else {
                    await this.mountRemote(this.name, mountConfig).catch((e) => console.warn('System initialization failed.', e)) // this root set internally
                }
            }

            // Case #3: Arbitrary Collection of Remote Files
            else if (this.name) this.root = ''

            // Send Name on Initialization 
            if (this.oninit instanceof Function) this.oninit(this.name)
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
        const split = path.split('/')
        const name = split[split.length - 1]
        const subDir = split.shift()
        path = split.join('/') // Path without directory name

        let target = this.files.system[subDir]
        split.forEach(str => target = target[str])

        const systemConstructor = this.constructor as any
        const system = new systemConstructor(name, {
            native: this.native,
            debug: this.debug,
            ignore: this.ignore,
            writable: this.writable,
            progress: this.progress,
            codecs: this.codecs,
        })
        await system.init()

        let drill = async (target, base) => {
            for (let key in target) {
                const newBase = pathUtils.get(key, base)
                const file = target[key]
                if (file instanceof RangeFile) await system.load(file, pathUtils.get(key, base))
                else await drill(file, newBase)
            }
        }

        await drill(target, path)
        return system
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

    checkToLoad = (path) => {

        const split = path.split("/");
        const fileName = split.pop();
       const toLoad = this.ignore.reduce((a, b) => {
          if (fileName === b) return a * 0;
          else if (path.includes(`${b}/`)) return a * 0;
          else return a * 1;
        }, 1);
        
        return toLoad
    }

    load = async (file, path: PathType, dependent?: string) => {

        const existingFile = this.files.list.get(path)
        if (existingFile) return existingFile
        else {

            // Convert to Remote File
            if (!file.name) file.name = info.name(path) // Default name
            if (!this.native) file = createRemoteFile(file, path, this)

            // Check to Load
            const toLoad = this.checkToLoad(file.path ?? path)
            if (toLoad) {
            
                // Use Library Load Function
                const rangeFile = await load(file, {
                    path,
                    system: this,
                    debug: this.debug,
                    codecs: this.codecs,
                    create: this.writable
                })  
                
                // Track Dependencies
                if (dependent){
                    if (!this.dependencies[dependent]) this.dependencies[dependent] = new Map()
                    this.dependencies[dependent].set(rangeFile.path, rangeFile)
                    if (!this.dependents[rangeFile.path]) this.dependents[rangeFile.path] = new Map()
                    const file = this.files.list.get(dependent)
                    this.dependents[rangeFile.path].set(file.path, file)
                } 

                return rangeFile

            } else console.warn(`Ignoring ${file.name}`)
        }
    }

    trackDependency = (path: PathType, dependent?: string) => {
        const rangeFile = this.files.list.get(path)
        if (!this.dependencies[dependent]) this.dependencies[dependent] = new Map()
        this.dependencies[dependent].set(path, rangeFile)
        if (!this.dependents[path]) this.dependents[path] = new Map()
        const file = this.files.list.get(dependent)
        this.dependents[path].set(file.path, file)
    }

    add = (file: RangeFile) => {
         
        // // Overwrite Existing Files
        if (!this.files.list.has(file.path)) {
            // console.warn(`Overwriting existing ${file.path} file`); // TODO: Overwrite all other entries too...
            // this.files.list.delete(file.path);

            // Add File to Groups
            this.groupConditions.forEach(func => func(file, file.path, this.files))
        } else console.warn(`${file.path} already exists in the ${this.name} system!`)

}


isNative: ConditionType = () => false // Always remote file

// ------------ Default Open Methods ------------
openNative: NativeOpenFunction;
openRemote: RemoteOpenFunction = openRemote

mountNative: MountMethod<NativeMountResponse>;
mountRemote: MountMethod<RemoteMountResponse>  = mountRemote


// ------------ Core Open Method (with path update) ------------
open = async (path, create?:boolean) => {
    if (!this.native) path = pathUtils.get(path, this.root) // Append root on remote


    // Loads internally
    const rangeFile = await open(path, { 
        path,
        debug: this.debug, 
        system: this,
        create: create ?? this.writable,
        codecs: this.codecs,
        // registry: this.registry
    })

    return rangeFile
}

// ------------ Core Save Method ------------
save = async (force, progress:ProgressCallbackType = this.progress) => await save(this.name, Array.from(this.files.list.values()), force, progress) // Save files with dependencies

// ------------ RangeFile Sync Method ------------
sync = async () => await iterAsync(this.files.list.values(), async entry => await entry.sync())

// ------------ Core Transfer Method ------------
transfer = async (target:System) => await transfer(this, target)

// ------------ Apply Other System Properties ------------
apply = async (system: any) => {
    
    this.name = system.name
    if (system.native) this.native = system.native
    if (system.debug) this.debug = system.debug
    if (system.ignore) this.ignore = system.ignore ?? []
    if (system.writable)  this.writable = system.writable
    if (system.progress) this.progress = system.progress
    if (system.codecs instanceof Codecs) this.codecs = system.codecs
    else  this.codecs = new Codecs([codecs, system.codecs]) // Provide all codecs
    

    // Transfer Files that were Loaded
    const files = system.files?.list
    if (files){
        await iterAsync(Array.from(files.values()), async (newFile) => {
            console.log('NewFile', newFile)
            const path = newFile.path
            let f = this.files.list.get(newFile.path) // get existing file

            // Load New File
            if (!f) await this.load(newFile, path)

            // Transfer Properties from Old File
            else await f.apply(newFile, false)

        })
    }

    // skip init
    this.root = system.root

}


}