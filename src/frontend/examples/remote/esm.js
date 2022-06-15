import * as freerange from '../../dist/index.esm.js'
import * as print from '../utils/print.js'

const remoteESMTest = async (paths) => {

    console.log('------------------ system (remote esm) ------------------')
    const esmRemote = new freerange.System(paths.remote.esm)
    await esmRemote.init()
    await print.system(esmRemote)
    esmRemote.save()
    
}

export default remoteESMTest