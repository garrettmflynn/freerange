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

### Codecs
The `Codecs` class allow for easily encoding and decoding files.

```javascript
const codecs = new freerange.Codecs()

const buffer = await codecs.encode('Hi there')
const text = await codecs.decode(buffer)
console.log('text', text)
```

For more than text encoding / decoding, you'll need to use our a codec from our library—or roll your own!

```javascript
const jsonPlugin = freerange.codecs.json
codecs.add(jsonPlugin)
const buffer = await codecs.encode({key: 'value'}, jsonPlugin.type)
const json = await codecs.decode(buffer, jsonPlugin.type)
console.log('JSON', json)
```


### System
The freerange `System` class allows you to rapidly access local and remote filesysems. It contains a `Codecs` instance to allow for generic read / write capabilities.

```javascript

document.querySelector('button').onclick = async () => {

    // ----------------- Declare a System -----------------
    // 1. Choose a directory in your local filesystem
    const system = new freerange.System() 

    // // 2. ES Module in a remote directory
    // const system = new freerange.System('https://raw.githubusercontent.com/brainsatplay/brainsatplay-starter-kit/main/app/index.js') 

    // // 3. File in the root of a remote directory
    // const system = new freerange.System('https://raw.githubusercontent.com/brainsatplay/freerange/main/README.md')

    // // 4. Arbitrary remote directory
    // const system = new freerange.System('foo') 

    await system.init()

    // ----------------- Get / Create Files -----------------
    // Text File
    const text = await system.open('test.txt', true) // get (or create) the file
    const textContents = await text.body // get file contents
    console.log('Existing Text', textContents)
    text.body = 'Hello world' // set file contents

    // JSON File
    const json = await system.open('test.json', true)
    const jsonContents = await json.body
    console.log('Existing JSON', jsonContents)
    json.body = {key: 'value'}

    // CSV File
    const csv = await system.open('test.csv', true)
    const csvContents = await csv.body
    console.log('Existing CSV', csvContents)
    csvContents.push({row: csvContents.length}) // We can change the csvContent variable directly because it is an object reference

    await system.save() // save file contents for all files (if changed)
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
2. ES6 imports using a remote URL will not work for local files