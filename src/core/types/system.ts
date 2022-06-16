import Codecs from '../codecs/Codecs'
import { CodecCollection, GroupType } from './index'
import { ProgressCallbackType } from './config'

export type Group = {[x:string]: GroupType}
export type ConditionType = (info:any) => boolean

export type SystemInfo = {
    native?: FileSystemDirectoryHandle
    ignore?: string[]
    debug?: boolean,
    writable?: boolean,
    progress?: ProgressCallbackType,
    codecs?: Codecs | CodecCollection,
    // registry?: RegistryType
}