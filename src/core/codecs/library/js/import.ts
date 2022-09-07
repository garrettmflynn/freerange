import * as pathUtils from "../../../utils/path"
import { objToString } from "../../../utils/parse.utils";
import { handleFetch } from "../../../system/remote/request";
import { BlobFile } from "../../../types";
import { ESMConfigType } from '../../../types/config';

//
// Import ES6 Modules (and replace their imports with actual file imports!)
// 

// NOTE: Will be thrown by comments, but is not catastrophic
const re = /import([ \n\t]*(?:(?:\* (?:as .+))|(?:[^ \n\t\{\}]+[ \n\t]*,?)|(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\}))[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])([ \n\t]*assert[ \n\t]*{type:[ \n\t]*(['"])([^'"\n]+)(?:['"])})?/g 
// const re = /import([ \n\t]*(?:\* (?:as .*))?(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])([ \n\t]*assert[ \n\t]*{type:[ \n\t]*(['"])([^'"\n]+)(?:['"])})?/g 
// var re = /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])([ \n\t]*assert[ \n\t]*{type:[ \n\t]*(['"])([^'"\n]+)(?:['"])})?/g;

const moduleDataURI = (text, mimeType='text/javascript') => `data:${mimeType};base64,` + btoa(text);

// Direct Import of ES6 Modules
const esmImport = async (text) => await import(moduleDataURI(text))


const safeESMImport =  async (text, config:ESMConfigType={}, onBlob?:Function, output: 'text') => {

    let module;
    try {
        module = await esmImport(text)
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
                const variables = m[1].replace(/\*\s+as/, '').trim().split(",");
                importInfo[m[3]] = variables // Save variables to path
            }
        } while (m);

        // Import Files
        for (let path in importInfo) {

            // Check If Already Exists
            let correctPath = pathUtils.get(path, childBase)
            const variables = importInfo[path];
           
      const dependentFilePath = pathUtils.get(correctPath)
      const dependentFileWithoutRoot = pathUtils.get(dependentFilePath.replace(config.system.root, ''))
      let existingFile = config.system.files.list.get(dependentFileWithoutRoot);
      
      // Or fetch from remote
      if (!existingFile?.file) {
        const info = await handleFetch(correctPath);
        let blob = new Blob([info.buffer], { type: info.type });
        existingFile = await config.system.load(blob, dependentFilePath);
      }

      const isJS = existingFile.mimeType === 'application/javascript'
      config.system.trackDependency(correctPath, dependentFileWithoutRoot);
      const newConfig = Object.assign({}, config)
      newConfig.path = dependentFileWithoutRoot
      const newText = await existingFile.text
      let importedText = (isJS) ? await safeESMImport(newText, newConfig, onBlob, 'text') : newText

      const dataUri = moduleDataURI(importedText, existingFile.mimeType);
        variables.forEach((str) => {

          text = `const ${str} =  await import('${dataUri}', ${isJS ? '{}' : '{assert: {type: "json"}}'});
${text}`;
        });
    }

        module = await esmImport(text)
    }


    if (output === 'text') return text
    else return module
}

export default safeESMImport