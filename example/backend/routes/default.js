import express   from 'express'
// import utils     from '../utils.js'
const router   = express.Router();
// import database  from './db.js'

import FileSystem from '../../../freerange-server/src/FileSystem.js';

// List Dataset Structure
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname + '/../datasets'

const files = new FileSystem({ root })

router.get("/filesystem", files.list)

router.get("/filesystem/*", files.get)

export default router;
