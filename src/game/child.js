const Game = require('./game.js');
const Message = require('../message.js');

let room = {};

setInterval(() => {
  if (room) {
    room.update();
  }
}, 1000 / 60);

process.on('message', (m) => {
  switch (m.type) {
    case 'initData': {
      room = new Game(m.data.room);

      room.addPlayer({
        hash: m.data.playerHash,
        id: m.data.playerId,
        name: m.data.playerName,
      });

      process.send(new Message('initData', {
        id: m.data.playerId,
        state: room.state,
        players: room.players,
        enemy: room.enemy.getClientData(),
        bullets: room.bullets,
      }));
      break;
    }
    case 'addPlayer': {
      room.addPlayer({
        hash: m.data.playerHash,
        id: m.data.playerId,
        name: m.data.playerName,
      });

      process.send(new Message('addPlayer', {
        hash: m.data.playerHash,
        player: room.players[m.data.playerHash],
      }));
      break;
    }
    case 'deletePlayer': {
      delete room.players[m.data.playerHash];

      process.send(new Message('deletePlayer', {
        hash: m.data.playerHash,
      }));
      break;
    }
    case 'updatePlayer': {
      if (room.state === 'preparing') {
        room.players[m.data.playerHash].updatePreparing(m.data.player);
      } else if (room.state === 'playing') {
        room.players[m.data.playerHash].updatePlaying(m.data.player);
      }
      break;
    }
    default: {
      console.log(`unclear type: ${m.type} from sockets.js`);
      break;
    }
  }
});
