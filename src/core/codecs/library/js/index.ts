import safeESMImport from './import'
import * as text from '../text'

export const type = "application/javascript"
export const suffixes = 'js'

export const encode = (moduleObject) => moduleObject // TODO: Cannot actually go back to code...
export const decode = async (o, config) => {
    const textContent = (!o.text) ? await text.decode(o) : o.text
    const imported = await safeESMImport(textContent, config) // Import ESM File
    if (imported) return imported
    else return textContent
}

