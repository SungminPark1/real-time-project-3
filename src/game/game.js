const Fighter = require('./classes/fighter.js');
const Enemy = require('./enemy.js');
const utils = require('../utils.js');

const GAME_PREPARING = 'preparing';
const GAME_PLAYING = 'playing';

class Game {
  constructor(data) {
    this.room = data;
    this.state = GAME_PLAYING; // cycle: preparing -> started -> restarting -> (loop)
    this.lastUpdate = new Date().getTime();
    this.dt = 0;

    this.players = {};
    this.enemy = {};
    this.bullets = []; // bullets are in enemy object - only has pos, radius, and drained value?

    // only nessesary data to set each update
    this.clientPlayers = {};
    this.clientEnemy = {};
    this.clientBullets = [];
  }

  addPlayer(user) {
    this.players[user.hash] = new Fighter(user);
    this.clientPlayers[user.hash] = this.players[user.hash].getClientData();
  }

  deletePlayer(hash) {
    delete this.players[hash];
  }

  setupGame() {
    const keys = Object.keys(this.players);

    for (let i = 0; i < keys.length; i++) {
      let color = {};
      let player = this.players[keys[i]];

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
  }

  checkCollision(user) {
    const player = user;

    for (let j = 0; j < this.bullets.length; j++) {
      const bullet = this.bullets[j];
      const distance = utils.circlesDistance(player.pos, bullet.pos);
      const grazeDistance = player.hitbox + player.graze + bullet.radius;

      // check if bullet is in graze distance
      if (distance < grazeDistance) {
        // if bullet hasn't been drained increase player energy and exp
        if (!bullet.drained) {
          player.energy = Math.min(player.energy++, player.maxEnergy);
          player.currentExp++;
          bullet.drained = true;

          // check if player should level up
          if (player.currentExp >= player.exp) {
            player.levelUp();
          }
        }

        // check if bullet is colliding with player
        if (distance < (player.hitbox + bullet.radius)) {
          player.hp -= this.enemy.damage;
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
            player.reviveTime += 5; // extend next revive time by 5 sec
          }

          // no longer need to check collisions if hit
          return;
        }
      }
    }
  }

  // check if players are ready
  preparing() {
    const keys = Object.keys(this.players);
    let readyPlayers = 0;

    for (let i = 0; i < keys.length; i++) {
      const player = this.players[keys[i]];

      if (player.ready) {
        readyPlayers++;
      }

      this.clientPlayers[keys[i]] = player.getClientData();
    }

    this.state = keys.length === readyPlayers ? GAME_PLAYING : this.state;
  }

  // update enemy, checks collision, checks if players are dead
  playing() {
    const keys = Object.keys(this.players);
    let deadPlayers = 0;

    // if enemy is dead - create new one and reward players
    // else loop through player for collisions
    if (this.enemy.hp <= 0) {
      // reward players - heal and exp
      for (let i = 0; i < keys.length; i++) {
        const player = this.players[keys[i]];

        player.currentExp += player.exp * 0.25;
        player.hp = Math.min(player.hp + (player.maxHp * 0.2), player.maxHp);

        // check if they level up
        if (player.currentExp > player.exp) {
          player.levelUp();
        }
      }

      // create new enemy
      // TO DO: pick random enemy type and str depends on player level
      this.bullets = [];
      this.enemy = new Enemy(1);
    } else {
      this.enemy.update(this.dt);

      // loop through players
      for (let i = 0; i < keys.length; i++) {
        const player = this.players[keys[i]];

        if (player.alive) {
          // dont check collision if hit
          if (player.hit > 0) {
            player.hit -= this.dt;
          } else {
            this.checkCollision(player);

            // charge basic attack if not usable
            if (player.currentAttRate > 0) {
              player.currentAttRate -= this.dt;
            }
          }

          // check skill used
          if (player.skill1Used) {
            player.skill1(this.enemy, this.player, this.bullets);
          }
          if (player.skill2Used) {
            player.skill1(this.enemy, this.player, this.bullets);
          }
        } else {
          deadPlayers++;
        }

        this.clientPlayers[keys[i]] = player.getClientData();
      }
    }

    // filter bullets data to send only necessary info
    this.clientBullets = this.bullets.map(bullet => ({
      pos: bullet.pos,
      radius: bullet.radius,
      drained: bullet.drained,
    }));

    this.state = keys.length === deadPlayers ? GAME_PREPARING : this.state;
  }

  // update dt and game based on state
  update() {
    const now = new Date().getTime();

    // in sec
    this.dt = (now - this.time) / 1000;

    if (this.state === GAME_PREPARING) {
      this.preparing();
    } else if (this.state === GAME_PLAYING) {
      // temp code
      const keys = Object.keys(this.players);
      for (let i = 0; i < keys.length; i++) {
        const player = this.players[keys[i]];
        this.clientPlayers[keys[i]] = player.getClientData();
      }
      // this.playing();
    } else {
      console.log(`unknown state: ${this.state}`);
      this.state = GAME_PREPARING;
    }
  }
}


module.exports = Game;
