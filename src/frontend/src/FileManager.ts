import FileHandler from '../../common/FileHandler'
import { mountCache } from './mount'
import mountNative from './native/mount';
import verifyPermission from './native/verify'
import iterAsync from '../../common/utils/iterate'
import { ConfigType } from '../../common/types/config'
import openNative from './native/open';
import BrowserSystem from './BrowserSystem';
import System from 'src/common/System';
import * as path from '../../common/utils/path'

class FileManager extends FileHandler {

    System = BrowserSystem // Override System Contructor

    constructor(options) {
        super(options)
    }

    // -------- Adaptation for the File System Access API --------
    // https://web.dev/file-system-access/#stored-file-or-directory-handles-and-permissions

    mountCache = async (progress) => {
        const handle = mountCache(this.directoryCacheName)
        if (handle) return this.mount(handle, {progress})
    }

    // Traverse File System Structure
    onhandle = async (handle, base = '', system: System, progressCallback:ConfigType['progress'] = undefined) => {

        await verifyPermission(handle, true)

        // Skip Directory Name in the Base String
        if (handle.name != system.root) base = (base) ? path.get(handle.name, base) : handle.name

        const files = []
        if (handle.kind === 'file') {
            if (progressCallback instanceof Function) files.push({ handle, base }) // Add file details to an iterable
            else await system.load(handle, base) // Load file immediately
        } else if (handle.kind === 'directory') {
            const arr = await iterAsync(handle.values(), (entry) => {
                return this.onhandle(entry, base, system, progressCallback)
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

}


export default FileManager