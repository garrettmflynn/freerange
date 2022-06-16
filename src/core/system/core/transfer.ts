import RangeFile from "../../RangeFile";
import System from '../System';

const transferEach = async (f, system) => {
    const path = f.path
    const newFile = await system.load({ name: f.name, data: f[`#body`]}, path)// Set file contents on new file 
    if (f.method === 'remote') f.parent = newFile.parent // Assign parent if remote file
}

// Transferring Paths and Parents Between Systems
const transfer = async (previousSystem: System, targetSystem?: System, transferList?:RangeFile[]) => {

    // Create New System (optional)
    if (!targetSystem) {
        const SystemConstructor = previousSystem.constructor as any
        targetSystem = new SystemConstructor()
        await targetSystem.init()
    }

    // Get List (optional)
    if (!transferList) transferList = Array.from(previousSystem.files.list.values())

    await Promise.all(transferList.map(async f => transferEach(f, targetSystem)))
    await targetSystem.save(true) // Force new files to save locally
}

export default transfer