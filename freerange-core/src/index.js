import getFileData from './get/index.browser.js'
import RangeFile from './RangeFile.js'
import FileManager from './FileManager.js'
import registry from './registry.js'

const getInfo = (file) => {
  let [name, ...extension] = (file.name ?? '').split('.') // Allow no name
  // Swap file mimeType if zipped
  let mimeType = file.type
  const zipped = (mimeType === registry['gz'] || extension.includes('gz'))
  if (zipped) extension.pop() // Pop off .gz
  if (zipped || !mimeType) mimeType = registry[extension[0]]
  return { mimeType, zipped, extension: extension.join('.') }
}

export {
  registry,
  getInfo,
  getFileData,
  RangeFile,
  FileManager,
}