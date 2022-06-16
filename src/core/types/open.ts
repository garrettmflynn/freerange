import RangeFile from '../RangeFile'
import { PathType } from './index'
import { ConfigType, LoadConfigType } from './config'
import System from '../system/System'


export type MountMethod<res> = (systemInfo?: any, config?: Partial<ConfigType>) => res

// ------------------------- Open Fuctions -------------------------

// NATIVE
// Could return a directory handle asynchronously
export type NativeMountResponse = Promise<void | FileSystemDirectoryHandle>
export type RemoteMountResponse = Promise<void | string>

// Promise<void> | Promise<FileSystemHandle> | FileSystemHandle  | OpenFileResponse
export type NativeOpenFunction = (
    path: PathType, 
    config: NativeOpenConfig,
) => Promise<RangeFile | FileSystemDirectoryHandle | FileSystemFileHandle >

// REMOTE
export type RemoteOpenFunction = (
    path: PathType, 
    config: RemoteOpenConfig
) => OpenFileResponse

export type OpenFileResponse = Promise<RangeFile>

// ------------------------- Open Config -------------------------
type OpenConfig = {
    type?: 'directory'| 'file', // Default to file
}  & LoadConfigType

export type NativeOpenConfig = {
    system: System, 
    create?: boolean,
    // onmount?: MountMethod
} & OpenConfig

export type RemoteOpenConfig = NativeOpenConfig


export type CombinedOpenConfig = RemoteOpenConfig & NativeOpenConfig