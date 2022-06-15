import System from 'src/common/System';
import openNative from './native/open'
import mountNative from './native/mount';

export default class BrowserSystem extends System {
    
    constructor (name, info) { 
        super(name, info)
    }

    isNative = (info) => !info || info instanceof FileSystemDirectoryHandle
    openNative = openNative
    mountNative = mountNative
}