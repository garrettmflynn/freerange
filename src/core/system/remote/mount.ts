import { ProgressCallbackType } from "../../types/config"
import { handleFetch } from "./request"
import { createFile } from "./index"
import System from '../System';
import { PathType } from '../../types';
import iterAsync from 'src/core/utils/iterate';

let mountRemote = async (url:string, config: {
    system: System,
    progress?: ProgressCallbackType
}): Promise<PathType> => {

    let filePath;

    await handleFetch(url, undefined, config.progress)
    .then(async response => {

        // Expose Files from the freerange FileSystem...
        if (response.type === 'application/json') {

            config.system.name = config.system.root = filePath = response.url // Specify full file path
            const datasets = JSON.parse(new TextDecoder().decode(response.buffer))


            let files = []
            const drill = (o) => {
                for (let key in o) {
                    const target = o[key]
                        if (typeof target === 'string') {
                            const path = `${response.url}/${target}`
                            const file = createFile(undefined, path, config.system)
                            files.push({file, path})
                        }
                        else drill(target)
                }
            }

            drill(datasets)

            let filesIterable = files.entries()
            await iterAsync(filesIterable, async ([i, {file, path}]) => await config.system.load(file , path))

        } else throw 'Endpoint is not a freerange filesystem!'

    }).catch(e => {throw 'Unable to connect to freerange filesystem!'})

    return filePath
}

export default mountRemote