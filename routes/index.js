var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', {});
});

/* GET room. */
router.get('/:id', function(req, res, next) {
  res.render('room', {});
});

module.exports = router;
