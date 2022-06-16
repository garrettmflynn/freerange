import { ExtensionType, RegistryType, FileConfig, Loaders } from "./types"
import {get} from "./info"
import * as gzip from './defaults/gzip'
import * as text from './defaults/text'
import * as defaults from './extensions'

const decode = async (o, fileInfo, config: FileConfig, defaultExtension: ExtensionType = text, extensions: Loaders = defaults.extensions, registry:RegistryType = defaults.registry) => {

    // Get Basic Info
    const { mimeType, zipped } = get(fileInfo, registry)
    if (zipped) o = await gzip.decode(o) // Unzip if required
    if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) return o.dataurl // Return dataurl if media

    // Check Extensions Object
    const extension = Object.values(extensions).find(o => o.mimeType === mimeType)
    if (extension && extension.decode instanceof Function) return extension.decode(o, config)
    
    // Fallback to Default Extension
    else {
        console.warn(`No decoder for ${mimeType}. Defaulting to ${defaultExtension.mimeType}...`)
        return defaultExtension.decode(o, config) // Decode as text by default
    }
}

export default decode