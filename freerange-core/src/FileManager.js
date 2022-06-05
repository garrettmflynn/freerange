import * as text from './defaults/text.js'
import * as gzip from './defaults/gzip.js'
import * as json from './defaults/json.js'
import * as datauri from './defaults/datauri.js'

import { getInfo } from './index.js'
import IterativeFile from './IterativeFile.js'

export default class FileManager {
    constructor(options={}) {
      this.extensions = {}
      this.debug = options.debug
      this.extend(json)
      this.extend(text)
    }

    get = async (file, options) => {
        const iterativeFile = new IterativeFile(file, Object.assign({manager: this, debug: this.debug}, options))
        await iterativeFile.init()
        return iterativeFile
    }
      
  
    encode = async (o, fileInfo) => {
      const {mimeType, zipped} = getInfo(fileInfo) // Spoof the original file
  
      let buffer = ''
      if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) content = datauri.encode(o)
  
      const extension = Object.values(this.extensions).find(o => o.mimeType === mimeType)
      if (extension && extension.encode instanceof Function) buffer = extension.encode(o)
      else {
        console.warn(`No encoder for ${mimeType}. Defaulting to text...`)
        buffer = text.encode(o) // Encode as text by default
      }
  
      if (zipped) buffer = await gzip.encode(buffer)
      return buffer
    }
  
    decode = async (o, fileInfo) => {
        
        const {mimeType, zipped} = getInfo(fileInfo)

      if (zipped) o = await gzip.decode(o, mimeType)
      if (mimeType && (mimeType.includes('image/') || mimeType.includes('video/'))) return o.dataurl
  
      const extension = Object.values(this.extensions).find(o => o.mimeType === mimeType)
      if (extension && extension.decode instanceof Function) return extension.decode(o)
      else {
        console.warn(`No decoder for ${mimeType}. Defaulting to text...`)
        return text.decode(o) // Decode as text by default
      }
    }
  
    extend = (ext) => {
      this.extensions[ext.mimeType] = ext
    }
  }