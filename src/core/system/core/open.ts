//
// File Open Utility with Optional Manager Support
//

import { CombinedOpenConfig } from '../../types/open'

const open = async (path, config: CombinedOpenConfig) => {

    config = Object.assign({}, config) // Allow mutation internally, but not for user

    // Skip This Method if Method is Local
    const useNative = !!config.system?.native

    let file: any = config.system.files.list.get(path) // file already exists
    if (file) return file
    else {

        // Native
        if (useNative && config.system.openNative instanceof Function) file = await config.system.openNative(path, config)
        
        // Remote
        else file = await config.system.openRemote(path, config)

        if (file) return file
    }
}

export default open