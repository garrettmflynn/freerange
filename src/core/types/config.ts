import { SystemType, MethodType, PathType, MountedType } from './index'
import { NativeOpenConfig, RemoteOpenConfig } from './open'
import System from '../System'
import Codecs from '../codecs/Codecs'

export type ProgressCallbackType = (mountedName:string, ratio: number, totalFiles: number) => null | undefined

// ------------------------- Configuration Objects  -------------------------
export type ConfigType = {

    // Required
    system: System
    switch: boolean,

    // Optional
    path?: PathType,
    systems?: MountedType,
    method?: MethodType,
    progress?: ProgressCallbackType
    fileMap?: SystemType['files']['list']
    // [x:string]: any

} & NativeOpenConfig & RemoteOpenConfig

export type LoadConfigType = {
    path: PathType,
    system: System, 
    codecs?: Codecs,
    debug?: boolean,
}

// Inherit so Import can be used in Open
export type ESMConfigType = {
    path?: ConfigType['path'],
    system?: System, 
    fileMap?: ConfigType['fileMap'],
} //| RangeFile
