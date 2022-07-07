var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');

var app = express();

const httpServer = require("http").createServer(app);
const options = { /* ... */ };
const io = require("socket.io")(httpServer, options);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.set('socketio', io);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', socket => {
  socket.on('join room', (data) => {
    console.log("New user connected to " + data.room)
    socket.join(data.room)
    socket.to(data.room).emit('alert others', {alert: 'someone has joined.'})
  })

  socket.on("send_draw", (data) => {
    socket.to(data.room).emit('receive_draw', {png: data.png})
  })
})

httpServer.listen(3330, () => {
  console.log('listening on port 3330')
})

module.exports = app;
