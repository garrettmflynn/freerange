import nativeTests from './native'
import remoteCollectionTest from './remote/arbitrary'
import remoteRootTest from './remote/root'
import config from './config'
import remoteESMTest from './remote/esm'

// Basic Buttons
document.querySelector('#native').onClick = async () => await nativeTests(config)
document.querySelector('#remote_esm').onClick = async () => await remoteESMTest(config)
document.querySelector('#remote_root').onClick = async () => await remoteRootTest(config)
document.querySelector('#remote_arbitrary').onClick = async () => await remoteCollectionTest(config)
