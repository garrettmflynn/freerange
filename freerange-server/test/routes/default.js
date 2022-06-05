import express   from 'express'
// import utils     from '../utils.js'
const router   = express.Router();
// import database  from './db.js'

import FileSystem from '../../src/FileSystem.js';

// List Dataset Structure
const files = new FileSystem({ root: 'datasets' })

router.get("/filesystem", files.list)

router.get("/filesystem/*", files.get)

export default router;
