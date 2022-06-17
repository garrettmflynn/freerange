import RangeFile from "../../RangeFile";
import System from '../System';
import { BlobFile } from 'src/core/types';

const transferEach = async (f, system) => {
    const path = f.path
    if (!f.storage.buffer) f.storage.buffer = await f.getFileData()

    const blob = new Blob([f.storage.buffer]) as BlobFile

    blob.name = f.name
    const newFile = await system.load(blob, path)// Set file contents on new file 
    if (!f.fileSystemHandle) {
        f.fileSystemHandle = newFile.fileSystemHandle // Abort saving for template remote files...
        f.method = 'transferred'
    }
}

// Transferring Paths and Parents Between Systems
const transfer = async (previousSystem: System, targetSystem?: System, transferList?:RangeFile[]) => {

    // Create New System (optional)
    if (!targetSystem) {
        const SystemConstructor = previousSystem.constructor as any
        targetSystem = new SystemConstructor(undefined, {
            native: previousSystem.native,
            debug: previousSystem.debug,
            ignore: previousSystem.ignore,
            writable: true, // Always create if not already there
            progress: previousSystem.progress,
            codecs: previousSystem.codecs,
        })

        await targetSystem.init()
    }

    // Get List (optional)
    if (!transferList) transferList = Array.from(previousSystem.files.list.values())

    // Start Transfer
    console.warn(`Starting transfer of ${transferList.length} files from ${previousSystem.name} to ${targetSystem.name}`)
    const tic = performance.now()
    await Promise.all(transferList.map(async f => transferEach(f, targetSystem)))
    const toc = performance.now()
    // if (this.debug) 
    console.warn(`Time to transfer files to ${targetSystem.name}: ${toc-tic}ms`)

}

export default transfer