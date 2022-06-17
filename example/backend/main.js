// ------------------ Node.js Code to Host Range-Gettable Remote Datasets ------------------
// We need to be able to save annotations from multiple people and compare them for agreement! 

import express        from 'express'
import http        from 'http'
import cors   from 'cors'
import bodyParser     from 'body-parser'
import cookieParser   from 'cookie-parser'

import config         from '../config.js'
import defaultroutes  from './routes/default.js'

const app = express();

app.use(bodyParser.json());
app.use(cookieParser())
app.use(cors());

/* ----- serve static ----- */
// app.use(express.static(path.join(__dirname, 'static')));
app.use('/', defaultroutes)
const port = config.port || 3000;

var server = http.createServer(app);
server.listen(port);
console.log(`Started app on port ${port}`);

// ---------------- IMPORTANT ----------------
// Depending on the needs of your users, you may need to increase this to
// allow for 1000+ multipart range requests (example in package.json).

let size = server.maxHeaderSize;
console.log('Max HTTP Header size is', size);


// ---------------- TESTS ----------------
// import nativeTests from '../tests/node/native'
import remoteCollectionTest from '../tests/remote/arbitrary'
import remoteRootTest from '../tests/remote/root'
import testConfig from '../tests/config'
import remoteESMTest from '../tests/remote/esm'
import FileSystem from '../../src/backend/src/FileSystem'
testConfig.System = FileSystem
// Basic Tests
// await nativeTests(config)
remoteESMTest(testConfig).then(async () => {
    await remoteRootTest(testConfig)
    await remoteCollectionTest(testConfig)
})


export default app;
