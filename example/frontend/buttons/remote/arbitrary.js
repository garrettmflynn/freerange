import * as freerange from '../../../../src/frontend/src/index'
import * as print from '../utils/print'

const remoteCollectionTest = async (paths) => {

    console.log('------------------ system.open (arbitrary collection) ------------------')
    const otherBareRemote = new freerange.System('test')
    await otherBareRemote.init()
    await otherBareRemote.open(paths.remote.root.base)
    await otherBareRemote.open(paths.remote.esm)
    await otherBareRemote.open(paths.remote.arbitrary)
    await print.system(otherBareRemote)
    otherBareRemote.save()

}

export default remoteCollectionTest