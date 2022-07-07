var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');

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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


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

let activeRooms = {}; // roomID: Set(userID1, userID2...);
let roomSizes = {}; // roomID: int;

io.on('connection', socket => {

  // let latest_drawing = "";

  socket.on('join room', (data) => {
    console.log("New user connected to " + data.room)
    socket.join(data.room)
    socket.to(data.room).emit('alert others', {alert: 'someone has joined.'})

    // add user to room when they join.
    if (activeRooms[data.room] === undefined) {
      activeRooms[data.room] = new Set()
    }
    activeRooms[data.room].add(...socket.rooms)

    // update room sizes
    if (roomSizes[data.room] === undefined) {
      roomSizes[data.room] = 0
    }
    roomSizes[data.room] = activeRooms[data.room].size
  });

  socket.on('send_draw', (data) => {
    socket.to(data.room).emit('receive_draw', {png: data.png, roomSize: roomSizes[data.room]})
  });

  socket.on('leave room', (data) => {
    if (roomSizes[data.room] !== undefined && roomSizes[data.room] > 0) {
      roomSizes[data.room] -= 1
    }
  });
});

httpServer.listen(3330, () => {
  console.log('listening on port 3330')
});

module.exports = app;
