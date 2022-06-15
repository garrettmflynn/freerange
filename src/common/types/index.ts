import { RangeConfig } from "./range";
import RangeFile from '../RangeFile';
import { LoadConfigType } from './config';
import System from '../System';

export type MimeType = string // e.g. text/plain

export type DecodeInfo = {
    file: BlobFile,
    buffer: ArrayBuffer,
    uint8?: Uint8Array,
    text?: string
}

// Track Freerange Extensions
export type ExtensionType = {
    mimeType: MimeType, // e.g. text/plain
    extension: string, // e.g. txt
    decode: (info, config) => any, // Object
    encode: (object, config) => ArrayBuffer, // Buffer
    config?: RangeConfig
}

// Track MimeType Information
export type RegistryType = {
    [x:string]: MimeType
}


// Basic File Types and Related Options
export type PathType = string
export type MethodType = 'remote' | 'native'
export type OptionsType = {
    ignore?: string[]
    debug?: boolean
}


export type GroupType = {
    initial: any,
    condition: (file:RangeFile, path:string, files:SystemType['files']) => any
}

export type MountedType = {[x:string]: System}

export type FileType = AnyObj
export type FileInfoOptions = {
    path?: FileConfig['path'],
    // directory?: FileConfig['directory']
    system?: SystemType
}

export type FileInfo = [FileType, FileInfoOptions]


export type BlobFile = Blob & {
    name: File['name']
    lastModified: File['lastModified']
    webkitRelativePath: File['webkitRelativePath']
}

export type TimeoutRequestInit = RequestInit & {timeout?: number}

export type AnyObj = {[x:string]: any}
export type RemoteFileType = {
    origin: SystemType['name'],
    path:PathType,
    options: TimeoutRequestInit
}

export type FileConfig = {
    path: string, // Required for the actual file
    directory: SystemType['name'] // Required for the actual file
    parent?: FileSystemDirectoryHandle
} & LoadConfigType

// File System Organization
export type SystemType = {

    // Required
    name: string, 

    // Optional
    changelog?: RangeFile[]
    native?: FileSystemDirectoryHandle
    files?: {
        // Default Groupings
        system?: {
            [x:string]: AnyObj | RangeFile // Nested RangeFiles
        },
        types?: {[x:string]: RangeFile[]}
        n?: number,
        list?: Map<PathType, RangeFile>

        // Arbitrary Groupings
    } & AnyObj

}