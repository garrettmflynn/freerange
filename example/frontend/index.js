import config from '../config.js'
import read from './js/read.js'

const get = document.querySelector('button')
const loader = document.querySelector('visualscript-loader')

let datasets
fetch(`${config.origin}:${config.port}/filesystem`, {mode: 'cors'})
.then(res => read(res, (ratio) => loader.progress = ratio))
.then(async result => {
    const ab = await result.arrayBuffer()
    datasets = JSON.parse(new TextDecoder().decode(ab))
    console.log("Datasets", datasets);
})

get.onclick = ( ) => {
    fetch(`${config.origin}:${config.port}/filesystem/chbmp/sub-CBM00001/eeg/sub-CBM00001_task-protmap_eeg.edf`, {mode: 'cors'})
    .then(res => read(res, (ratio) => {
        console.log('Ratio', ratio)
    }))
    .then(result => {
        console.log("Stream complete", result);
    })
}
