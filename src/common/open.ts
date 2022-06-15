//
// File Open Utility with Optional Manager Support
//

import { CombinedOpenConfig } from './types/open'

const open = async (path, config: CombinedOpenConfig) => {

    config = Object.assign({}, config) // Allow mutation internally, but not for user

    // Skip This Method if Method is Local
    const useNative = !!config.system?.native
    const hasNative = config.system?.openNative instanceof Function

    let file: any = config.system.files.list.get(path) // file already exists
    if (file) return file
    else {
        if (useNative && hasNative) file = await config.system.openNative(path, config)

        // Otherwise Try Remote Request (with native fallback)
        else {
            try {
                file = await config.system.openRemote(path, config)
            } catch (e) {
                console.warn('Remote failed', e)
                if (hasNative) {
                    console.warn('Falling back to native filesystem for future calls to this system', config.system)
                    file = await config.system.openNative(path, config)
                } else console.warn('No native filesystem method to fall back to...')
            }
        }

        if (file) return file
        else console.error(`Could not open ${path}...`)
    }
}

export default open