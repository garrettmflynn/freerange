import System from 'src/core/system/System';
import openNative from './native/open'
import mountNative from './native/mount';


// Extension for the File System Access API
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API

export default class LocalSystem extends System {
    
    constructor (name, info) { 
        super(name, info)
    }

    isNative = (info) => !info || info instanceof FileSystemDirectoryHandle
    openNative = openNative
    mountNative = mountNative
}