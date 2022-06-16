import * as pathUtils from "../../../utils/path"
import { objToString } from "../../../utils/parse.utils";
import { handleFetch } from "../../../remote/request";
import { BlobFile } from "../../../types";
import { ESMConfigType } from '../../../types/config';

//
// Import ES6 Modules (and replace their imports with actual file imports!)
// 

// Direct Import of ES6 Modules
const esmImport = async (text) => {
    const moduleDataURI = "data:text/javascript;base64," + btoa(text);
    let imported = await import(moduleDataURI)
    if (imported.default && Object.keys(imported).length === 1) imported = imported.default
    return imported
}

const safeESMImport =  async (text, config:ESMConfigType={}, onBlob?:Function) => {


    try {
        return await esmImport(text)
    }

    // Catch Nested Imports
    catch (e) {

        console.warn(`${config.path} contains ES6 imports. Manually importing these modules...`)
        const base = pathUtils.get("", config.path);
        let childBase = (config.system.root) ? pathUtils.get(base, config.system.root) : base

        // Use a Regular Expression to Splice Out the Import Details
        const importInfo = {}
        var re = /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])/g;
        let m;
        do {
            m = re.exec(text)
            if (m == null) m = re.exec(text); // be extra sure (weird bug)
            if (m) {
                text = text.replace(m[0], ``) // Replace found text
                const variables = m[1].trim().split(',')
                importInfo[m[3]] = variables // Save variables to path
            }
        } while (m);

        // Import Files
        for (let path in importInfo) {

            // Check If Already Exists
            let correctPath = pathUtils.get(path, childBase)
            const variables = importInfo[path];

            let blob;
                const info = await handleFetch(correctPath)
                blob = new Blob([info.buffer], {type: info.type}) as BlobFile
                await config.system.load(blob, correctPath)  // load into system               

                const imported = await safeESMImport(await blob.text(), {
                    path: correctPath,
                    system: config.system
                }, onBlob);

                if (variables.length > 1) {
                    variables.forEach((str) => {
                        text = `const ${str} = ${objToString(imported[str])}
${text}`;
                    });
                } else {
                    text = `const ${variables[0]} = ${objToString(imported)}
${text}`;
                }
        }

        const tryImport = await esmImport(text)

        return tryImport
    }
}

export default safeESMImport