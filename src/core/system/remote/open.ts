import { handleFetch } from "./request";
import { BlobFile, MethodType } from "../../types";
import { OpenFileResponse, RemoteOpenConfig } from '../../types/open';
import { load } from '../core/load';
import { createFile } from './index';

// Open Remote File
const openRemote = async (path, config: RemoteOpenConfig): OpenFileResponse => {

    let {
        system, 
        // codecs, 
        // debug
    } = config

    return await handleFetch(path).then(async info => {
        const splitURL = info.url.split("/")
        const fileName = splitURL.pop();
        // let systemName = splitURL.join('/') // base of the filesystem is the directory holding the entrypoint
        let blob = new Blob([info.buffer], { type: info.type }) as BlobFile // Converting blob to File Spoof
        blob.name = fileName;

        const file = createFile(blob, info.url, system)
        const rangeFile = await system.load(file, info.url)

        return rangeFile
    })
}

export default openRemote