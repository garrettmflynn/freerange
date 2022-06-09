# freerange
File import and export utilities with **free** range-request support for remote files.

## Installation
### Browser
```javascript
<script src="https://cdn.jsdelivr.net/npm/freerange"></script>
```

### ES Modules
```javascript
import * as freerange from `https://cdn.jsdelivr.net/npm/freerange/index.esm.js`
```

## Getting Started
```javascript
const manager = new freerange.FileManager() // instantiate a manager

document.querySelector('button').onclick = async () => {

     await manager.mount()// choose a directory in your local filesystem

    // Create a Text File
    const text = await manager.open('test.txt') // get (or create) the file
    const textContents = await text.body // get file contents
    console.log('Existing Text', textContents)
    text.body = 'Hello world' // set file contents

    // Create a JSON File
    const json = await manager.open('test.json')
    const jsonContents = await json.body
    console.log('Existing JSON', jsonContents)
    json.body = {key: 'value'}

    const csv = await manager.open('test.csv')
    const csvContents = await csv.body
    console.log('Existing CSV', csvContents)
    csvContents.push({row: csvContents.length}) // We can change the csvContent variable directly because it is an object reference

    await manager.save() // save file contents for all files (if changed)
}
```

## Roadmap
1. Currently, multi-part requests are broken up client-side. Fix this!
    - For some reason, multi-part requests that are too long end up bouncing from the server
    - This current approach is very expensive. Concatenate on the server!
2. Currently only supports range requests for .edf files. Implement more!
3. Currently only supports iterative read. Allow writing to specific bytes!
4. Implement NWB as an extension...

## Known Issue
1. Postprocessing a large number of bytes (e.g. for EDF files) results in long wait times.