var express = require('express');
var router = express.Router();
const roomController = require('../controller/index.js');

/* GET home page. */
router.get('/', roomController.getHome);

/* GET room. */
router.get('/:id', roomController.getRoom);

/* POST new room. */
router.post('/create-room', roomController.createRoom);

module.exports = router;
