import nativeTests from './native.js'
import remoteCollectionTest from './remote/arbitrary.js'
import remoteRootTest from './remote/root.js'
import config from './config.js'
import remoteESMTest from './remote/esm.js'

document.querySelector('#native').onclick = async () => await nativeTests(config)
document.querySelector('#remote_esm').onclick = async () => await remoteESMTest(config)
document.querySelector('#remote_root').onclick = async () => await remoteRootTest(config)
document.querySelector('#remote_arbitrary').onclick = async () => await remoteCollectionTest(config)
