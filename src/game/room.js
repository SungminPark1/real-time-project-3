const child = require('child_process');

const GAME_PLAYING = 'playing';
class Room {
  constructor(data) {
    this.room = data;
    this.state = GAME_PLAYING; // cycle: preparing -> started -> restarting -> (loop)
  }

  startUpdate(io) {
    this.update = child.fork('./src/game/child.js');

    this.update.on('message', (m) => {
      switch (m.type) {
        case 'initData': {
          const { state, players, enemy, bullets } = m.data;
          this.state = state;
          this.players = players;
          this.enemy = enemy;

          // send to new player
          io.to(m.data.id).emit('initData', {
            state,
            players,
            enemy,
            bullets,
          });
          break;
        }
        case 'addPlayer': {
          this.players[m.data.hash] = m.data.player;

          const { state, players, enemy } = this;

          // emit initData to new player
          io.to(m.data.player.id).emit('initData', {
            state,
            players,
            enemy,
          });

          // emit new player to other players
          io.sockets.in(this.room).emit('addPlayer', {
            hash: m.data.hash,
            player: m.data.player,
          });
          break;
        }
        case 'levelPlayer': {
          io.sockets.in(this.room).emit('levelPlayer', {
            hash: m.data.hash,
            player: m.data.player,
          });
          break;
        }
        case 'deletePlayer': {
          if (this.players[m.data.hash]) {
            delete this.players[m.data.hash];
          }

          io.sockets.in(this.room).emit('removePlayer', m.data.hash);
          break;
        }
        case 'playerPreparing': {
          io.sockets.in(this.room).emit('playerPreparing', m.data);
          break;
        }
        case 'playerIsAlive': {
          io.sockets.in(this.room).emit('playerIsAlive', m.data);
          break;
        }
        case 'playerAttacking': {
          io.sockets.in(this.room).emit('playerAttacking', m.data);
          break;
        }
        case 'playerUsedSkill': {
          io.sockets.in(this.room).emit('playerUsedSkill', m.data);
          break;
        }
        case 'startGame': {
          io.sockets.in(this.room).emit('startGame', m.data);
          break;
        }
        case 'updateRoom': {
          // TO DO
          // update main server values

          const { state, players, enemy, bullets } = m.data;
          io.sockets.in(this.room).emit('update', {
            state,
            players,
            enemy,
            bullets,
          });
          break;
        }
        default: {
          console.log(`unclear type: ${m.type} from collision.js`);
          break;
        }
      }
    });

    this.update.on('error', (error) => {
      console.dir(error);
    });

    this.update.on('close', (code, signal) => {
      console.log(`Child closed with ${code} ${signal}`);
    });

    this.update.on('exit', (code, signal) => {
      console.log(`Child exited with ${code} ${signal}`);
    });
  }
}

module.exports = Room;
