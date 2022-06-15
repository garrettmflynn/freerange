import { ProgressCallbackType } from "../types/config"
import { handleFetch } from "./request"
import { createFile } from "./index"
import System from '../System';
import { PathType } from '../types';

let mountRemote = async (url:string, config: {
    system: System,
    progress?: ProgressCallbackType
}): Promise<PathType> => {

    let filePath;

    await handleFetch(url, undefined, config.progress)
    .then(async response => {

        // Expose Files from the freerange FileSystem...
        if (response.type === 'application/json') {

            filePath = response.url // Specify full file path
            const datasets = JSON.parse(new TextDecoder().decode(response.buffer))

            const drill = (o) => {
                for (let key in o) {
                    const target = o[key]
                        if (typeof target === 'string') {
                            const path = `${response.url}/${target}`
                            const file = createFile(undefined, path, config.system)
                            config.system.load(file, path)
                        }
                        else drill(target)
                }
            }

            drill(datasets)
        } else console.error('Not able to get freerange FileSystem...')

    }).catch(e => {
        console.error('File System Load Error', e)
    })

    return filePath
}

export default mountRemote