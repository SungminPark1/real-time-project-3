const xxh = require('xxhashjs');
const Room = require('./game/room.js');
const Message = require('./message.js');

let io;
const gameRooms = {};

// on connect put player in lobby
const onJoin = (sock) => {
  const socket = sock;

  // create player's hash and put them in the lobby room
  socket.on('join', () => {
    const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16);

    console.log(`new player: ${hash}`);

    socket.join('lobby');
    socket.room = 'lobby';
    socket.hash = hash;

    // emit back room names and player count
    const keys = Object.keys(gameRooms);
    const rooms = {};

    // loop through rooms and extract state and player count
    for (let i = 0; i < keys.length; i++) {
      const { state, players } = gameRooms[keys[i]];

      rooms[keys[i]] = {
        state,
        count: Object.keys(players).length,
      };
    }

    socket.emit('hash', { hash });
    socket.emit('roomList', rooms);
  });
};

// move the player to the room name they choose
// if room doesn't exist - create room
// else - they join the existing room
const onChangeRoom = (sock) => {
  const socket = sock;

  socket.on('changeRoom', (data) => {
    if (!gameRooms[data.room]) {
      // Heroku is breaking somewhere here
      // If two players are in the lobby and a new room
      // is created the lobby will break and the app will error

      socket.leave('lobby');
      socket.join(data.room);
      socket.room = data.room;

      gameRooms[data.room] = new Room(data.room);
      const room = gameRooms[data.room];

      room.startUpdate(io);

      // fire to create room in child process
      console.log('fireing initData');
      room.update.send(new Message('initData', {
        room: data.room,
        playerHash: socket.hash,
        playerId: socket.id,
        playerName: data.user.name,
      }));
    } else {
      // check if username is already in use
      const keys = Object.keys(gameRooms[data.room].players);

      for (let i = 0; i < keys.length; i++) {
        if (data.user.name === keys[i]) {
          socket.emit('usernameError', { msg: 'Username already in use' });
          return;
        }
      }

      socket.leave('lobby');
      socket.join(data.room);
      socket.room = data.room;

      const room = gameRooms[data.room];

      // add player to child process update
      room.update.send(new Message('addPlayer', {
        playerHash: socket.hash,
        playerId: socket.id,
        playerName: data.user.name,
      }));
    }
  });
};

// refresh room listing in lobby
const onRoomRefresh = (sock) => {
  const socket = sock;

  socket.on('refreshRoom', () => {
    // emit back room names and player count
    const keys = Object.keys(gameRooms);
    const rooms = {};

    for (let i = 0; i < keys.length; i++) {
      const { state, players } = gameRooms[keys[i]];

      rooms[keys[i]] = {
        state,
        count: Object.keys(players).length,
      };
    }

    socket.emit('roomList', rooms);
  });
};

// update player movement
const onUpdatePlayer = (sock) => {
  const socket = sock;

  socket.on('updatePlayer', (user) => {
    const room = gameRooms[socket.room];

    // send updated position to child process update
    // only send if room exist
    if (room) {
      room.update.send(new Message('updatePlayer', {
        playerHash: socket.hash,
        player: user,
      }));
    }
  });
};

// TO DO EMIT BACK READY
// toggle player's ready
const onTogglePlayerReady = (sock) => {
  const socket = sock;

  socket.on('togglePlayerReady', (user) => {
    const room = gameRooms[socket.room];

    room.players[socket.hash].toggleReady(user);

    io.sockets.in(socket.room).emit('playerReady', {
      hash: socket.hash,
      ready: user.ready,
    });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    // find the disconnected players room and deleted the player
    if (socket.room !== 'lobby') {
      const keys = Object.keys(gameRooms); // get the keys of the game rooms

      for (let i = 0; i < keys.length; i++) {
        const game = gameRooms[keys[i]];

        // check if the game's room matches the socket's room
        if (game.room === socket.room) {
          // delete player in child process
          game.update.send(new Message('deletePlayer', {
            playerHash: socket.hash,
          }));

          if (game.players[socket.hash]) {
            delete game.players[socket.hash];
            console.log('deleted player sockets.js');
          }

          socket.leave(socket.room);
          // deletes room if no players exist in it
          if (Object.keys(game.players).length === 0) {
            game.update.kill();

            delete gameRooms[keys[i]];
          }
        }
      }
    } else {
      console.log(`lobby socket ${socket.hash} left`);
      socket.leave('lobby');
    }
  });
};

const setupSockets = (ioServer) => {
  io = ioServer;

  io.sockets.on('connection', (socket) => {
    onJoin(socket);
    onChangeRoom(socket);
    onRoomRefresh(socket);
    onUpdatePlayer(socket);
    onTogglePlayerReady(socket);
    onDisconnect(socket);
  });
};

module.exports = {
  setupSockets,
};
