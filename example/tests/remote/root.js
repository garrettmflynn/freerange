import * as print from '../utils/print'

const remoteRootTest = async (config) => {

    console.log('------------------ system (readme at root with known structure) ------------------')
    const otherRemote = new config.System(config.remote.root.base, {writable: true})
    await otherRemote.init()
    await print.system(otherRemote)

    console.log('Getting HTML File in Known System', config.remote.root.html)
    const html = await otherRemote.open(config.remote.root.html)
    await print.file(html)
    
    console.log('Getting App ESM File in Known System', config.remote.root.js)
    const app = await otherRemote.open(config.remote.root.js)
    await print.file(app)

    otherRemote.save()


}

export default remoteRootTest