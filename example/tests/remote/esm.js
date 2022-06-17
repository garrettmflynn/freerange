import * as print from '../utils/print'

const remoteESMTest = async (config) => {

    console.log('------------------ system (remote esm) ------------------')
    const esmRemote = new config.System(config.remote.esm, {writable: true})
    await esmRemote.init()
    await print.system(esmRemote)
    esmRemote.save()
    
}

export default remoteESMTest