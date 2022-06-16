import { ExtensionType, AnyObj } from './types'

const extend = (ext: ExtensionType, extensions: AnyObj, registry: AnyObj) => {

    extensions[ext.mimeType] = ext
    const guessExtension = ext.mimeType.split('-').splice(-1)[0]
    registry[ext.extension ?? guessExtension] = ext.mimeType
}

export default extend