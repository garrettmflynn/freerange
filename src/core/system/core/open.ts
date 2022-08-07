//
// File Open Utility with Optional Manager Support
//

import { get } from 'src/core/utils/path'
import { CombinedOpenConfig } from '../../types/open'

const open = async (paths, config: CombinedOpenConfig) => {

    config = Object.assign({}, config) // Allow mutation internally, but not for user
    const useNative = !!config.system?.native; // Skip This Method if Method is Local
    if (typeof paths === 'string'){
      paths = {base: paths}
    }

    for (let key in paths) {
        paths[key] = get(paths[key], "");
      };
      
    let file:any = config.system.files.list.get(paths.base) ?? config.system.files.list.get(paths.remote)
    

    if (file) return file
    else {
        if (useNative && config.system.openNative instanceof Function)
        file = await config.system.openNative(paths.base, config);
        else {
            if (paths.remote) file = await config.system.openRemote(paths.remote, config);
            if (!file) file = await config.system.openRemote(paths.base, config);
        }

        if (file) return file
    }
}

export default open