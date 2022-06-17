import { RegistryType, CodecCollection, Codec, CodecMap, MimeType, FileConfig } from '../types'
import * as text from './library/text';
import decode from './decode';
import encode from './encode'

export default class Codecs {

    suffixToType: RegistryType = {};
    collection: CodecMap = new Map()

    constructor (codecsInput:Codecs | CodecCollection | (Codecs | CodecCollection)[] ) {
        if (!Array.isArray(codecsInput)) codecsInput = [codecsInput]

        codecsInput.forEach((codecs) => {
            if (codecs instanceof Codecs) codecs.collection.forEach(this.add)
            else for (let key in codecs) this.add(codecs[key]) // Add to Codecs
        })
    }

    add = (codec: Codec) => {
        this.collection.set(codec.type, codec)

        // Handle Single or Array Suffixes
        let suffixes = (codec.suffixes) ? codec.suffixes : codec.type.split('-').splice(-1)[0]
        if (!Array.isArray(suffixes)) suffixes = [suffixes]
        suffixes.forEach(suffix => this.suffixToType[suffix] = codec.type)
    }

    get = (mimeType:MimeType) => this.collection.get(mimeType)
    getType = (suffix:string) => this.suffixToType[suffix]

    decode = (o, type:MimeType, name?:string, config?: FileConfig) => decode(o, type, name, config, undefined, this)
    encode = (o, type:MimeType, name?:string, config?: FileConfig) => encode(o, type, name, config, undefined, this)


    // Notify user if the specified file has dependencies
    hasDependencies = (file) => {
        return (file.mimeType === 'application/javascript')
    }
}