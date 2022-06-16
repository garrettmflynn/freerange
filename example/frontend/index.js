import config from '../config.js'
import * as files from '../../src/frontend/src/index.js'
import * as edf from '../../extensions/edf/index.js'

// ------------- Run Button Configuration -------------
import'./buttons'


// ------------- Get File Manager -------------
let file, system;

const loaders = { edf }
const options = {
    debug: true,
    ignore: ['DS_Store'],
    loaders
}
// const manager = new files.FileManager({
//     debug: true,
//     ignore: ['DS_Store']
// })
// manager.extend(edf)


// ------------- Get Elements -------------
const localMount = document.querySelector('#local')
const remoteMount = document.querySelector('#remote')

const loader = document.querySelector('visualscript-loader')
const editor = document.querySelector('visualscript-object-editor')
const texteditor = document.querySelector('textarea')

texteditor.oninput = () => {
    if (file) file.body = texteditor.value
}

document.onkeydown = async (e) => {
    if (e.metaKey && e.code == 'KeyS') {
        e.preventDefault()
        system.save()
    }
};

const maxArrLen = 50
editor.preprocess = async (val) => {
    let resolved
    
    for (let key in val){
        if (val[key] instanceof files.RangeFile && !val[key].rangeSupported) {
            val[key] = await val[key].body
        }
    }


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
    system = new files.System(undefined, options)
    system.progress = globalProgressCallback
    await system.init()
    onMount(system.files)
}

const visualLoaders = {}
const progressCallback = (id, ratio, loader) => {
    if (!loader) {
        if (!visualLoaders[id]) {
            visualLoaders[id] = new visualscript.Loader()
            visualLoaders[id].type = 'linear'
            visualLoaders[id].text = id
            iterativeDiv.insertAdjacentElement('afterbegin', visualLoaders[id])
        }
        loader = visualLoaders[id]
    } else loader.text = id // Set text to ID
    
    loader.progress = ratio
}

const onMount = async (files) => {
    console.log('File System', system)
    const allDirs = Object.keys(files.system).reduce((a,b) => a * b.split('.').length === 1, true)
    if (allDirs) for (let name in files.system) addDataset(name) // List datasets
    else {
        editor.set(files.system) // Highlight dir
    }

    if (system.native){
        file = await system.open('freerange/test.txt', true)
        console.log('freerange/test.txt', file)
        if (file){
            const value = await file.body
            texteditor.value = value
        }
    }
}


const addDataset = (key) => {
    const button = document.createElement('visualscript-button')
    button.size = 'small'
    button.innerHTML = key
    button.onClick = async () => {

        iterativeDiv.innerHTML = ''

        // ----------- REMOTE -----------
        console.log('Getting subsystem')
        const dir = await system.getSubsystem(key)
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
remoteMount.onClick = async () => {
    const filesystemURL = `${config.origin}:${config.port}/filesystem`
    loader.text = filesystemURL

    system = new files.System(filesystemURL, options)
    await system.init()
    system.progress = globalProgressCallback
    onMount(system.files)
}

// // ------------- Try Mounting from the Cache -------------
// manager.mountCache(globalProgressCallback).then(onMount)
