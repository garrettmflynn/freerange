# freerange
File import and export utilities with free range-request support for remote files

## How to Use
```javascript
import * as freerange from `https://cdn.jsdelivr.net/npm/freerange`
const manager = new freerange.FileManager()
await manager.mount()
const file = manager.open('test.txt')
file.body = 'Hello world'
await manager.save()
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