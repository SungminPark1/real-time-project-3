const xxh = require('xxhashjs');
const Room = require('./game/room.js');
const Message = require('./message.js');

let io;
const gameRooms = {};

// update room data and sent data to client at set interval
/*
  const updateRoom = (room) => {
    gameRooms[room].update();

    // send message to update child process rooms

    const { state, clientPlayers, clientBullets } = gameRooms[room];

    // only emit bullets, stats and player pos and score?
    io.sockets.in(room).emit('update', {
      state,
      players: clientPlayers,
      bullets: clientBullets,
    });

    const { state, players, clientPlayers, clientBullets } = gameRooms[room];

    // only emit bullets, stats and player pos and score?
    io.sockets.in(room).emit('update', {
      state,
      players: players,
      bullets: clientBullets,
    });
  };
*/

// on connect put player in lobby
const onJoin = (sock) => {
  const socket = sock;

  // create player's hash and put them in the lobby room
  socket.on('join', () => {
    const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16);

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
      socket.leave('lobby');
      socket.join(data.room);
      socket.room = data.room;

      gameRooms[data.room] = new Room(data.room);
      const room = gameRooms[data.room];

      room.startUpdate(io);
      // gameRooms[data.room].addPlayer(data.user);

      // fire to create room in child process
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
        player: room.players[socket.hash],
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
    room.update.send(new Message('updatePlayer', {
      playerHash: socket.hash,
      player: user,
    }));
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

          delete game.players[socket.hash];

          socket.leave(socket.room);
          // deletes room if no players exist in it
          if (Object.keys(game.players).length === 0) {
            game.update.kill();

            delete gameRooms[keys[i]];
          }
        }
      }
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
