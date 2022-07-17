import * as pathUtils from "../../../utils/path"
import { objToString } from "../../../utils/parse.utils";
import { handleFetch } from "../../../system/remote/request";
import { BlobFile } from "../../../types";
import { ESMConfigType } from '../../../types/config';

//
// Import ES6 Modules (and replace their imports with actual file imports!)
// 

const re = /import([ \n\t]*(?:\* (?:as .*))?(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])([ \n\t]*assert[ \n\t]*{type:[ \n\t]*(['"])([^'"\n]+)(?:['"])})?/g 
// var re = /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])([ \n\t]*assert[ \n\t]*{type:[ \n\t]*(['"])([^'"\n]+)(?:['"])})?/g;

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

        const needsRoot = config.system.root && !config.system.native // Only remote files need root
        let childBase = (needsRoot) ? pathUtils.get(base, config.system.root) : base;

        // Use a Regular Expression to Splice Out the Import Details
        const importInfo = {}
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
            let existingFile = config.system.files.list.get(pathUtils.get(correctPath))

            // Or Fetch From Remote
            if (!existingFile?.file){
                const info = await handleFetch(correctPath)
                let blob = new Blob([info.buffer], {type: info.type}) as BlobFile
                existingFile = await config.system.load(blob, correctPath)  // load into system    
            }        
            
            config.system.trackDependency(correctPath, config.path)   

                let imported = await existingFile.body

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