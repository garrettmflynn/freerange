import { Codec, FileConfig, MimeType } from "../types"
import {get} from "../utils/info"
import * as text from './library/text'
import * as gzip from './library/gzip'
import * as dataurl from './library/datauri'
import Codecs from './Codecs'

const encode = async (o,  type:MimeType, name?:string, config?: FileConfig, defaultCodec: Codec = text, codecs?: Codecs) => {
    
    // Get Basic Info
    let buffer = new ArrayBuffer(0)
    const { mimeType, zipped } = get(type, name, codecs)
    if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) return dataurl.encode(o) // Convert dataurl if media

    // Check Codecs
    const codec = (codecs) ? codecs.get(mimeType) : null
    if (codec && codec.encode instanceof Function) buffer = codec.encode(o, config)

    // Fallback to Default Codec
    else {
        console.warn(`No encoder for ${mimeType}. Defaulting to ${defaultCodec.type}...`)
        buffer = defaultCodec.encode(o, config) // Encode as text by default
    }

    // Zip (if required)
    if (zipped) buffer = await gzip.encode(buffer)

    return buffer

}

export default encode