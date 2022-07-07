// room set

let activeRooms = new Set();

// get home page

const getHome = (req, res, next) => {
    res.render('home', {});
};

// get room

const getRoom = (req, res, next) => {
    if (activeRooms.has(req.params.id) === true) {
        res.render('room', { 'roomID': req.params.id });
    } else {
        res.render('error', { 'status': 404, 'message': 'page not found' })
    }
};

// post create new room

const createRoom = (req, res, next) => {
    let id = ''
    for (let i = 0; i < 4; i++) {
        id += Math.floor(Math.random() * 9)
    }
  
    activeRooms.add(id)
    res.json({ redirect: `/${id}`, 'color': req.body.color})
};

module.exports = {
    getHome, getRoom, createRoom
}