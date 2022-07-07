var express = require('express');
var router = express.Router();
const roomController = require('../controller/index.js');

/* GET home page. */
router.get('/', roomController.getHome);

/* POST new room. */
router.post('/create-room', roomController.createRoom);

/* GET room. */
router.get('/:id', roomController.getRoom);


module.exports = router;
