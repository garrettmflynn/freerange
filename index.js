import config from './config.js'
import read from './js/read.js'

const get = document.querySelector('button')

let datasets
fetch(`${config.origin}:${config.port}/filesystem`)
.then(res => read(res, (ratio) => {
    console.log('Ratio', ratio)
}))
.then(async result => {
    const ab = await result.arrayBuffer()
    datasets = JSON.parse(new TextDecoder().decode(ab))
    console.log("Datasets", datasets);
})

get.onclick = ( ) => {
    fetch(`${config.origin}:${config.port}/filesystem/chbmp/sub-CBM00001/eeg/sub-CBM00001_task-protmap_eeg.edf`)
    .then(res => read(res, (ratio) => {
        console.log('Ratio', ratio)
    }))
    .then(result => {
        console.log("Stream complete", result);
    })
}
