# freerange
File import and export utilities with free range-request support for remote files

## Installation
### Browser
```javascript
<script src="https://cdn.jsdelivr.net/npm/freerange@0.0.20"></script>
```

### ES Modules
```javascript
import * as freerange from `https://cdn.jsdelivr.net/npm/freerange/index.esm.js`
```

## Getting Started
```javascript
const manager = new freerange.FileManager() // instantiate a manager

document.querySelector('button').onclick = async () => {
    await manager.mount() // choose a directory in your local filesystem
    const file = await manager.open('test.txt') // get the file
    console.log('Existing Text', await file.body) // get file contents
    file.body = 'Hello world' // set file contents
    await manager.save() // save file contents (if changed)
}
```

## Classes
### FileManager
A class to help manage files on the browser. 

### FileSystem
A class to help manage the local filesystem.

## Roadmap
1. Currently, multi-part requests are broken up client-side. Fix this!
    - For some reason, multi-part requests that are too long end up bouncing from the server
    - This current approach is very expensive. Concatenate on the server!
2. Currently only supports range requests for .edf files. Implement more!
3. Currently only supports iterative read. Allow writing to specific bytes!
4. Implement NWB again...

## Known Issue
1. Postprocessing a large number of bytes (e.g. for EDF files) results in long wait times.