import System from 'src/core/system/System'
import { ConfigType } from 'src/core/types/config'
import verifyPermission from './verify'
import iterAsync from 'src/core/utils/iterate'
import * as path from '../../../core/utils/path'

// Traverse File System Structure
const onhandle = async (handle, base = '', system: System, progressCallback:ConfigType['progress'] = undefined) => {

    // const ogBase = base
    await verifyPermission(handle, true)

    // Skip Directory Name in the Base String
    if (handle.name != system.name) base = (base) ? path.get(handle.name, base) : handle.name

    const files = []
    if (handle.kind === 'file') {
        if (progressCallback instanceof Function) files.push({ handle, base }) // Add file details to an iterable
        else await system.load(handle, base) // Load file immediately
    } else if (handle.kind === 'directory') {
        const arr = await iterAsync(handle.values(), (entry) => {
            return onhandle(entry, base, system, progressCallback)
        })

        files.push(...(arr as any).flat())
    }



    // Iterate through Entire File List (of known length) 
    // Note: Only if callback is a function
    if (!base) {
        let count = 0
        await iterAsync(files, async (o) => {
            await system.load(o.handle, o.base)
            count++
            progressCallback(system.name, count / files.length, files.length)
        })
    }

    return files
}



const mountNative = async (handle: FileSystemDirectoryHandle | undefined, config: ConfigType) => {
    if (!handle) handle = await window.showDirectoryPicker();
    if (config?.system) {
        config.system.name = config.system.root = handle.name 
        config.system.native = handle
    }
    await onhandle(handle, null, config?.system, config?.progress)
    return handle
}

export default mountNative