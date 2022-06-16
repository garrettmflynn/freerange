import FileHandler from '../../core/FileHandler'
// import { mountCache } from './mount'
import BrowserSystem from './BrowserSystem';

// -------- Adaptation for the File System Access API --------
// https://web.dev/file-system-access/#stored-file-or-directory-handles-and-permissions

class FileManager extends FileHandler {

    System = BrowserSystem // Override System Contructor

    constructor(options) {
        super(options)
    }

    // mountCache = async (progress) => {
    //     const handle = mountCache(this.directoryCacheName)
    //     if (handle) return this.mount(handle, {progress})
    // }

}


export default FileManager