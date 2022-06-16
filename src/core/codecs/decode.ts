import { Codec, FileConfig, MimeType } from "../types"
import {get} from "../utils/info"
import * as gzip from './library/gzip'
import * as text from './library/text'
import Codecs from './Codecs'

const decode = async (o,  type:MimeType, name?:string, config?: FileConfig, defaultCodec: Codec = text, codecs?: Codecs) => {

    // Get Basic Info
    const { mimeType, zipped } = get(type, name, codecs)
    if (zipped) o = await gzip.decode(o) // Unzip if required
    if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) return o.dataurl // Return dataurl if media

    // Check Codecs
    const codec = (codecs) ? codecs.get(mimeType) : null
    if (codec && codec.decode instanceof Function) return codec.decode(o, config)

    // Fallback to Default Codec
    else {
        console.warn(`No decoder for ${mimeType}. Defaulting to ${defaultCodec.type}...`)
        return defaultCodec.decode(o, config) // Decode as text by default
    }
}

export default decode