import * as text from '../text'
import remoteImport, { moduleDataURI } from 'remote-esm/index'

export const type = "application/javascript"
export const suffixes = 'js'



export const encode = () => undefined // TODO: Cannot actually go back to code...
export const decode = async (o, config) => {

    if (!config.onImport) config.onImport = async (path, info) => {
        let existingFile = config.system.files.list.get(path);
        if (!existingFile?.file) existingFile = await config.system.addExternal(path, info.file); // loading blob
        console.error('NOT TRACKING DEPENDENCY')
        // config.system.trackDependency(correctPath, path);
    }
    const textContent = (!o.text) ? await text.decode(o) : o.text
    const daturi = moduleDataURI(textContent)
    const imported = await remoteImport(daturi, config) // Import ESM File
    if (imported) return imported
    else return textContent
}

