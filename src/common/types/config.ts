import { SystemType, MethodType, PathType, MountedType, RegistryType, ExtensionType } from './index'
import { NativeOpenConfig, RemoteOpenConfig, CombinedOpenConfig } from './open'
import System from '../System'

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
    registry?: RegistryType,
    loaders?: {[x:string]: ExtensionType},
    debug?: boolean,
}

// Inherit so Import can be used in Open
export type ESMConfigType = {
    path?: ConfigType['path'],
    system?: System, 
    fileMap?: ConfigType['fileMap'],
} //| RangeFile
