import { FileConfig, PathType, FileType } from "../types";
import RangeFile from "../RangeFile";
import openSystem from "./open";
import { createFile as createRemoteFile } from "../remote";
import { LoadConfigType } from '../types/config';
import System from '../System';

export const load = async (file, config: LoadConfigType) => {
        let {path, system, codecs, debug} = config

            // Get Path to File
            if (!path) path = file.webkitRelativePath ?? file.relativePath ?? file.path ?? ''
            config.path = path // Update path if changed
            let fileConfig = config as FileConfig // Added path...

            if (!(file instanceof RangeFile)) {

                // Native Filesystem
                if (system.native) {
                    if (!(file instanceof FileSystemFileHandle)) {

                    // if(load.native.check(file)){
                        const pathWithoutName = path.split('/').slice(0, -1).join('/')

                        // TODO: Ensure that this actually works...
                        const openInfo =  await openSystem(pathWithoutName, {
                            path: pathWithoutName,
                            system, 
                            create: false,
                            codecs,
                            debug,
                            type: 'directory'
                        })

                        if (openInfo && openInfo instanceof FileSystemDirectoryHandle) fileConfig.parent = openInfo
                    }
                } 
                
                // Remote
                else {

                    // With a System Root
                    if (fileConfig.system.root){
                        const directoryPath = new URL(fileConfig.system.root).pathname.split("/")
                        const url = new URL(fileConfig.path);
                        path = file.path = fileConfig.path = url.pathname.split("/").filter((str, i) => directoryPath?.[i] != str).join("/");
                    } 
                    
                    // Arbitrary Collection
                    else path = file.path = fileConfig.path
                }

                file = new RangeFile(file, fileConfig) //Object.assign({ manager: this, debug: this.debug }, config))
                await file.init()
                system.add(file) // Add File in load
            }

            return file as RangeFile
}

export const createFile = (file:FileType = {}, path: PathType, system: System) => {
    if (system.native) return file
    else return createRemoteFile(file, path, system)
}