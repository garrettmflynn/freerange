import { AnyObj, MethodType } from "../../../common/types";
import RangeFile from "../../../common/RangeFile";
import { createFile, load } from "../../../common/load";
import { NativeOpenConfig, NativeOpenFunction } from 'src/common/types/open';

const openNative: NativeOpenFunction = async (
    path, 
    config: NativeOpenConfig
) => {


    let nativeHandle = config.system.native
    let fileSystem = config.system?.files?.['system']


    let {system, create} = config

      let pathTokens = path.split("/");
      let fileName = (config.type === 'directory') ? null : pathTokens.pop()
      pathTokens = pathTokens.filter((f) => !!f);

      // Drill Into Directories
      if (pathTokens.length > 0) {
        for (const token of pathTokens) {
          const handle = await nativeHandle.getDirectoryHandle(token, { create: true }).catch(e => console.warn(`${token} is an invalid file system handle`, e))
          if (handle) {
            nativeHandle = handle
            if (!fileSystem[token])
            fileSystem[token] = {};
            if (!(fileSystem[token] instanceof RangeFile)) fileSystem = fileSystem[token] as AnyObj;
          }
        }
      }

      if (fileName) {

        let existingFile = fileSystem[fileName] as RangeFile
        if (!(existingFile instanceof RangeFile)){

          const fileHandle = await nativeHandle.getFileHandle(fileName, { create }).catch(e => {
            if (config.create) console.warn(`Could not create ${fileName}. There may be a directory of the same name...`, e)
            else console.warn(`No file found at ${path}.`)
          })

          if (!fileHandle) return;
          const file = createFile(fileHandle, path, system)
          existingFile = await system.load(file, path);
        }

        return existingFile

      } else return nativeHandle // Return a Directory
}

export default openNative