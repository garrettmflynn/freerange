import nativeTests from '../tests/browser/native'
import remoteCollectionTest from '../tests/remote/arbitrary'
import remoteRootTest from '../tests/remote/root'
import config from '../tests/config'
import remoteESMTest from '../tests/remote/esm'
import LocalSystem from '../../src/frontend/src/LocalSystem'

config.System = LocalSystem

// Basic Buttons
document.querySelector('#native').onClick = async () => await nativeTests(config)
document.querySelector('#remote_esm').onClick = async () => await remoteESMTest(config)
document.querySelector('#remote_root').onClick = async () => await remoteRootTest(config)
document.querySelector('#remote_arbitrary').onClick = async () => await remoteCollectionTest(config)
