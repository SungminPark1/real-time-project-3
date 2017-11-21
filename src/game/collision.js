const utils = require('../utils.js');
const Fighter = require('./classes/fighter.js');
const Enemy = require('./enemy.js');
const Message = require('../message.js');

const GAME_PREPARING = 'preparing';
const GAME_PLAYING = 'playing';
let room = {};

const checkCollision = (user) => {
  const player = user;

  for (let j = 0; j < room.bullets.length; j++) {
    const bullet = room.bullets[j];
    const distance = utils.circlesDistance(player.pos, bullet.pos);
    const grazeDistance = player.hitbox + player.graze + bullet.radius;

    // check if bullet is in graze distance
    if (distance < grazeDistance) {
      // if bullet hasn't been drained increase player energy and exp
      if (!bullet.drained) {
        player.energy = Math.min(player.energy + 1, player.maxEnergy);
        player.currentExp++;
        bullet.drained = true;

        // check if player should level up
        if (player.currentExp >= player.exp) {
          player.levelUp();
        }
      }

      // check if bullet is colliding with player
      if (distance < (player.hitbox + bullet.radius)) {
        player.hp -= room.enemy.damage;
        player.hit = player.invul;
        player.energy = Math.round(player.energy * 0.75);

        bullet.active = false;

        // check if player died
        if (player.hp <= 0) {
          player.hp = 0;
          player.energy = 0;
          player.currentExp = Math.round(player.currentExp * 0.5);
          player.alive = false;
          player.reviveTimer = player.reviveTime;
        }

        // no longer need to check collisions if hit
        return;
      }
    }
  }
};

const setupGame = () => {
  const keys = Object.keys(room.players);

  for (let i = 0; i < keys.length; i++) {
    let color = {};
    let player = room.players[keys[i]];

    // set player color
    if (i === 0) {
      color = {
        r: 255,
        g: 0,
        b: 0,
      };
    } else if (i === 1) {
      color = {
        r: 0,
        g: 255,
        b: 0,
      };
    } else if (i === 2) {
      color = {
        r: 0,
        g: 255,
        b: 255,
      };
    } else {
      color = {
        r: 255,
        g: 165,
        b: 0,
      };
    }

    const user = {
      hash: player.hash,
      name: player.name,
    };
    const pos = {
      x: 85 + (i * 150),
      y: 400,
    };

    player = new Fighter(user, pos, color);
  }
};

// check if players are ready
const preparing = () => {
  const keys = Object.keys(room.players);
  let readyPlayers = 0;

  for (let i = 0; i < keys.length; i++) {
    const player = room.players[keys[i]];

    if (player.ready) {
      readyPlayers++;
    }

    room.clientPlayers[keys[i]] = player.getClientData();
  }

  setupGame();
  room.state = keys.length === readyPlayers ? GAME_PLAYING : room.state;
};

// update enemy, checks collision, checks if players are dead
const playing = () => {
  const keys = Object.keys(room.players);
  let deadPlayers = 0;

  // if enemy is dead - create new one and reward players
  // else loop through player for collisions
  if (!room.enemy || room.enemy.hp <= 0) {
    // reward players - heal and exp
    for (let i = 0; i < keys.length; i++) {
      const player = room.players[keys[i]];

      player.currentExp += player.exp * 0.25;
      player.hp = Math.min(player.hp + (player.maxHp * 0.2), player.maxHp);

      // check if they level up
      if (player.currentExp > player.exp) {
        player.levelUp();
      }
    }

    // create new enemy
    // TO DO: pick random enemy type and str depends on player level
    room.bullets = [];
    room.enemy = new Enemy(1);
  } else {
    room.enemy.update(room.dt);

    // loop through players
    for (let i = 0; i < keys.length; i++) {
      const player = room.players[keys[i]];

      if (player.alive) {
        // dont check collision if hit
        if (player.hit > 0) {
          player.hit -= room.dt;
        } else {
          checkCollision(player);
        }

        // charge basic attack if not usable
        if (player.currentAttRate > 0) {
          player.currentAttRate -= room.dt;
        } else {
          player.currentAttRate = 0;
        }

        // check skill used
        if (player.skill1Used) {
          player.skill1(room.enemy, room.player, room.bullets);
        }
        if (player.skill2Used) {
          player.skill1(room.enemy, room.player, room.bullets);
        }
      } else {
        deadPlayers++;
        player.reviveTimer -= room.dt;

        // revive player when revive timer ends
        if (player.reviveTimer <= 0) {
          player.reviveTimer = 0;
          player.reviveTime += 5; // extend next revive time by 5 sec
          player.alive = true;
          player.hp = player.maxHp;
        }
      }

      room.clientPlayers[keys[i]] = player.getClientData();
    }
  }

  room.bullets = room.enemy.bullets;

  // filter bullets data to send only necessary info
  room.clientBullets = room.bullets.map(bullet => ({
    pos: bullet.pos,
    radius: bullet.radius,
    drained: bullet.drained,
  }));

  // this.state = keys.length === deadPlayers ? GAME_PREPARING : this.state;

  // emit updated info back
  process.send(new Message('updateRoom', {
    state: room.state,
    players: room.players,
    bullets: room.clientBullets,
  }));
};

// update dt and game based on state
const update = () => {
  const now = new Date().getTime();

  // in sec
  room.dt = (now - room.lastUpdate) / 1000;
  room.lastUpdate = now;

  if (room.state === GAME_PREPARING) {
    preparing();
  } else if (room.state === GAME_PLAYING) {
    playing();
  } else {
    console.log(`unknown state: ${room.state}`);
    room.state = GAME_PREPARING;
  }
};

setInterval(() => {
  update();
}, 1000 / 60);

process.on('message', (m) => {
  switch (m.type) {
    case 'initData': {
      room = m.data.room;
      room.enemy = new Enemy(1);

      room.players[m.data.playerHash] = new Fighter({
        hash: m.data.playerHash,
        id: m.data.playerId,
        name: m.data.playerName,
      });

      process.send(new Message('initData', {
        id: m.data.playerId,
        enemy: room.enemy,
        players: room.players,
        bullets: room.bullets,
      }));
      break;
    }
    case 'addPlayer': {
      room.players[m.data.playerHash] = new Fighter({
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
      break;
    }
    case 'updatePlayer': {
      room.players[m.data.playerHash].update(m.data.player);
      break;
    }
    default: {
      console.log(`unclear type: ${m.type} from sockets.js`);
      break;
    }
  }
});
