import config from '../config.js'
import * as files from '../../freerange-core/src/index.js'
import * as edf from '../../extensions/edf/index.js'
import * as tsv from '../../extensions/tsv/index.js'

// ------------- Get File Manager -------------
let file;
const manager = new files.FileManager({
    debug: true,
    ignore: ['DS_Store']
})
manager.extend(edf)
manager.extend(tsv)

// ------------- Get Elements -------------
const localMount = document.querySelector('#local')
const remoteMount = document.querySelector('#remote')

const loader = document.querySelector('visualscript-loader')
const editor = document.querySelector('visualscript-object-editor')
const texteditor = document.querySelector('textarea')

document.onkeydown = async (e) => {
    if (e.metaKey && e.code == 'KeyS') {
        e.preventDefault()
        manager.save()
    }
};

texteditor.oninput = (ev) => {
    if (file) file.body = ev.target.value
}

const maxArrLen = 50
editor.preprocess = async (val) => {
    let resolved

    if (val instanceof files.RangeFile) resolved = val.body  // get body
    else resolved = await val 

    if (resolved.length > maxArrLen) {
        console.warn(`Only showing the first ${maxArrLen} items in the array for demonstration.`)
        resolved = resolved.slice(0, maxArrLen)
    }

    return resolved
}

const iterativeDiv = document.querySelector('#iterative')
const controlsDiv = document.querySelector('#controls')

const globalProgressCallback = (id, ratio) => progressCallback(id, ratio, loader)

// ------------- Get Local Dataset -------------
localMount.onClick = async () => {
    await manager.mount(null, globalProgressCallback).then(onMount)
}

const loaders = {}
const progressCallback = (id, ratio, loader) => {
    if (!loader) {
        if (!loaders[id]) {
            loaders[id] = new visualscript.Loader()
            loaders[id].type = 'linear'
            loaders[id].text = id
            iterativeDiv.insertAdjacentElement('afterbegin', loaders[id])
        }
        loader = loaders[id]
    } else loader.text = id // Set text to ID
    
    loader.progress = ratio
}

const onMount = async (files) => {
    console.log('File System', files, files.system, manager)
    const allDirs = Object.keys(files.system).reduce((a,b) => a * b.split('.').length === 1, true)
    if (allDirs) for (let name in files.system) addDataset(name) // List datasets
    else editor.set(files.system) // Highlight dir

    file = await manager.open('freerange/test.txt')
    const value = await file.body
    console.log('Value', value)
    texteditor.value = value
}


const addDataset = (key) => {
    const button = document.createElement('visualscript-button')
    button.size = 'small'
    button.innerHTML = key
    button.onClick = async () => {

        iterativeDiv.innerHTML = ''

        // ----------- REMOTE -----------
        console.log('Getting subsystem')
        const dir = await manager.getSubsystem(key)
        console.log(key, dir)

        editor.set(dir.system) // Show filesystem

        // if (dir.types.edf){
        //     const iterative = Object.values(dir.types.edf)[0]
        //     iterative.progressCallback = (id, ratio) => progressCallback(id, ratio)
        //     editor.set(iterative.body)
        //     console.log('Range File', iterative, iterative.body)

        //     const value = await iterative.body.channels[0].data
        //     console.log('First Channel Data', value)
        // } else console.error('No EDF files in this dataset...')
    }

    controlsDiv.appendChild(button)
}


// ------------- Get Datasets -------------
remoteMount.onClick = () => {
    const filesystemURL = `${config.origin}:${config.port}/filesystem`
    loader.text = filesystemURL
    manager.mount(
        filesystemURL, 
        globalProgressCallback
    ).then(onMount)
}

// // ------------- Try Mounting from the Cache -------------
// manager.mountCache(globalProgressCallback).then(onMount)
