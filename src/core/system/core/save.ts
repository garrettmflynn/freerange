import RangeFile from "../../RangeFile"
import iterAsync from "../../utils/iterate"
import { ProgressCallbackType } from '../../types/config'

const saveEach = async (rangeFile, config, counter, length) => {
    await rangeFile.save(config.force)
    counter = counter + 1
    if (config.progressCallback instanceof Function) config.progressCallback(config.name, counter / length, length)
}

const save = (name:string, files: RangeFile[], force, progressCallback?:ProgressCallbackType) => {

    let length = files
    return new Promise(async (resolve, reject) => {
        let i = 0
        const firstFile = files.shift()
        await saveEach(firstFile, {progressCallback, name, force}, i, length) // Check first file in case of transfer
        await iterAsync(files, (f) => saveEach(f, {progressCallback, name, force}, i, length))
        resolve()
    })
}

export default save