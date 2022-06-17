import * as print from '../utils/print'

const remoteCollectionTest = async (config) => {

    console.log('------------------ system.open (arbitrary collection) ------------------')
    const otherBareRemote = new config.System('test', {writable: true})
    await otherBareRemote.init()
    await otherBareRemote.open(config.remote.root.base)
    await otherBareRemote.open(config.remote.esm)
    await otherBareRemote.open(config.remote.arbitrary)
    await print.system(otherBareRemote)
    otherBareRemote.save()

}

export default remoteCollectionTest