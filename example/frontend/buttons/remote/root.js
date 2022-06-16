import * as freerange from '../../../../src/frontend/src/index'
import * as print from '../utils/print'

const remoteRootTest = async (paths) => {

    console.log('------------------ system (readme at root with known structure) ------------------')
    const otherRemote = new freerange.System(paths.remote.root.base)
    await otherRemote.init()
    await print.system(otherRemote)

    console.log('Getting HTML File in Known System', paths.remote.root.html)
    const html = await otherRemote.open(paths.remote.root.html)
    await print.file(html)
    
    console.log('Getting App ESM File in Known System', paths.remote.root.js)
    const app = await otherRemote.open(paths.remote.root.js)
    await print.file(app)

    otherRemote.save()


}

export default remoteRootTest