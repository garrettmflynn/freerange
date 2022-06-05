// ------------------ Node.js Code to Host Range-Gettable Remote Datasets ------------------
// We need to be able to save annotations from multiple people and compare them for agreement! 


import express        from 'express'
import cors   from 'cors'
import bodyParser     from 'body-parser'
import cookieParser   from 'cookie-parser'
// import path           from 'path'

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
app.listen(port);
console.log(`Started app on port ${port}`);

export default app;
