import { RegistryType, ExtensionType, FileConfig } from "./types"
import {get} from "./info"
import * as text from './defaults/text'
import * as gzip from './defaults/gzip'
import * as dataurl from './defaults/datauri'
import * as defaults from './extensions'

const encode = async (o, fileInfo, config?: FileConfig, defaultExtension: ExtensionType = text, extensions: {[x:string]:ExtensionType} = defaults.extensions, registry:RegistryType = defaults.registry) => {
    
    // Get Basic Info
    let buffer = new ArrayBuffer(0)
    const { mimeType, zipped } = get(fileInfo, registry)
    if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) return dataurl.encode(o) // Convert dataurl if media

    // Check Extensions Object
    const extension = Object.values(extensions).find(o => o.mimeType === mimeType)
    if (extension && extension.encode instanceof Function) buffer = extension.encode(o, config)
    
    // Fallback to Default Extension
    else {
        console.warn(`No encoder for ${mimeType}. Defaulting to ${defaultExtension.mimeType}...`)
        buffer = defaultExtension.encode(o, config) // Encode as text by default
    }

    // Zip (if required)
    if (zipped) buffer = await gzip.encode(buffer)

    return buffer

}

export default encode