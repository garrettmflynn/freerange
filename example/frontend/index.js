import config from '../config.js'
import * as files from '../../freerange-core/src/index.js'
import * as edf from '../../extensions/edf/index.js'
import * as tsv from '../../extensions/tsv/index.js'

// ------------- Get Elements -------------
const localMount = document.querySelector('#local')
const remoteMount = document.querySelector('#remote')

const loader = document.querySelector('visualscript-loader')
const editor = document.querySelector('visualscript-object-editor')
editor.preprocess = async (val) => {
    const resolved = await val
    return resolved
}

const iterativeDiv = document.querySelector('#iterative')
const controlsDiv = document.querySelector('#controls')

// ------------- Get File Manager -------------
const manager = new files.FileManager({
    debug: true,
    ignore: ['DS_Store']
})
manager.extend(edf)
manager.extend(tsv)


// ------------- Get Local Dataset -------------
localMount.onClick = async () => {
    await manager.mount().then(onMount)
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
    }
    
    loader.progress = ratio
}

const onMount = (files) => {
    console.log('File System', files, files.system)
    for (let name in files.system) addDataset(name)
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

        if (dir.types.edf){
            const iterative = Object.values(dir.types.edf)[0]
            iterative.progressCallback = (id, ratio) => progressCallback(id, ratio)
            editor.set(iterative.data)
            console.log('Range File', iterative, iterative.data)

            const value = await iterative.data.channels[0].data
            console.log('First Channel Data', value)
        } else console.error('No EDF files in this dataset...')
    }

    controlsDiv.appendChild(button)
}


// ------------- Get Datasets -------------
remoteMount.onClick = () => {
    const filesystemURL = `${config.origin}:${config.port}/filesystem`
    loader.text = filesystemURL
    manager.mount(
        filesystemURL, 
        (id, ratio) => progressCallback(id, ratio, loader)
    ).then(onMount)
}

