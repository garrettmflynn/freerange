import RangeFile from "../../RangeFile";
import System from '../System';
import { BlobFile } from 'src/core/types';

const transferEach = async (f, system) => {
        const path = f.path
        if (!f.storage.buffer) f.storage = await f.getFileData()

        const blob = new Blob([f.storage.buffer]) as BlobFile

        blob.name = f.name
        let newFile = await system.open(path, true) // Open file in native system
        if (!f.fileSystemHandle) {
            f.fileSystemHandle = newFile.fileSystemHandle // Abort saving for template remote files...
            f.method = 'transferred'
        }
    }

// Transferring Paths and Parents Between Systems
const transfer = async (previousSystem: System, targetSystem?: System, transferList?:RangeFile[]) => {

    // Get List (optional)
    if (!transferList) transferList = Array.from(previousSystem.files.list.values())
    const notTransferred = transferList.filter(f => f.method != 'transferred')

    // Only transfer files not already transferred
    if (notTransferred.length > 0){

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

        // Start Transfer
        console.warn(`Starting transfer of ${notTransferred.length} files from ${previousSystem.name} to ${targetSystem.name}`, transferList)
        const tic = performance.now()
        await Promise.all(notTransferred.map(async f => transferEach(f, targetSystem))) // transfer all
        const toc = performance.now()
        // if (this.debug) 
        console.warn(`Time to transfer files to ${targetSystem.name}: ${toc-tic}ms`)
        await Promise.all(notTransferred.map(async f => f.save(true))) // save all

        previousSystem.apply(targetSystem)
    }
}

export default transfer