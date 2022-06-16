import * as loaders from './defaults'
import * as types from './types/index'
import * as configTypes from './types/config'
import * as openTypes from './types/open'
import transfer from './transfer'
import setConfig from './config'
import extend from './extend'
import System from './System'

export default class FileHandler {

    System = System

    loaders: {[x:string]: types.ExtensionType} = {}
    registry: types.RegistryType = {}
    debug: boolean;

    ignore: types.OptionsType['ignore']
    directoryCacheName: string = 'freerangeCache'

    // Filesystem Registry
    mounted: types.MountedType = {} // nothing mounted yet...
    active: System = null

    constructor(options: types.OptionsType = {}) {
        this.debug = options.debug
        this.ignore = options.ignore ?? []
    }

    // ------------Add Loaders ------------
    extend = (ext: types.ExtensionType) =>  extend(ext, this.loaders, this.registry)

    onconfig = (config: Partial<configTypes.ConfigType> = {}) => {

        // Deep Clones the Configuration Object
        config = setConfig(config, { system: this.active })

        return config as configTypes.ConfigType // TODO: Ensure this is full...
    }


    // ------------------------ File Open Methods ------------------------
    open = async (path, config) => {
        config = this.onconfig(config) as openTypes.CombinedOpenConfig // Auto-Fill Config Object
        config.registry = this.registry
        config.loaders = this.loaders

        return await config.system.open(path, config) // Will add file to system
    }

    // ------------------------ Native Filesystem Management Methods ------------------------
    create = async (
        systemInfo, 
        config: Partial<configTypes.ConfigType> = {}
    ) => {

        // let native;
        // if (!(typeof systemInfo === 'string')) {
        //     native = systemInfo
        //     systemInfo = systemInfo.name
        // }

        config = this.onconfig(config) // Auto-Fill Config Object

        config.system = this.mounted[systemInfo]
        if (!config.system) {
            config.system = new this.System(systemInfo, {
                // native,
                debug: this.debug,
                ignore: this.ignore,
                writable: true
            })
            await config.system.init()
        }

        console.log('New System', config.system)
        // config.system.reset()  // Create filesystem

        this.mounted[config.system.name] = config.system // Place in this handler
        
        if (config.switch) this.switch(config.system) // Switch to this filesystem automatically
        return config.system
    }

    switch = (system: System | string) => {
        if (system) {
            if (typeof system === 'string') system = this.mounted[system]
            this.active = system
            if (this.onswitch instanceof Function) this.onswitch(system)
        } else console.warn('No system provided to switch to.')
    }

    onswitch = null // Switch Callback

    // ------------------------ Core Management Methods ------------------------

    addDefaultLoaders = () => {
        for (let key in loaders) this.extend(loaders[key])
    }

    mount = async (systemInfo, config) => {

        config = this.onconfig(config) // Auto-Fill Configuration Object

        // Mutate Configuration Object
        config.system = await this.create(systemInfo, config)

        // Switch filesystem if specified by the user (or the first mounted...)
        if (Object.keys(this.mounted).length === 1) config.switch = true
        if (config.switch) this.switch(config.system) 
        else console.warn(`FileManager has not globally switched to the ${config.system.name} filesystem`)

        return config.system
    }

    sync = async (mountedName = this.active.name) => this.mounted[mountedName].sync()

    save = async (mountedName = this.active.name, force, progressCallback?:configTypes.ConfigType['progress']) => await this.mounted[mountedName].save(force, progressCallback)

    // Move Specified Filesystem to New Native Filesystem
    transfer = async (toTransfer:System, targetSystem: System = this.active) => {
        await transfer(toTransfer, targetSystem) // Transfer files to new system
        await this.switch(targetSystem) // Switch when complete
        return targetSystem.files // Return new filesystem
    }
}