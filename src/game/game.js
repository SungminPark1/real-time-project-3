const Message = require('../message.js');
const utils = require('../utils.js');

// Player Classes
const Fighter = require('./classes/fighter.js');
const Bomber = require('./classes/bomber.js');
const Aura = require('./classes/aura.js');
const Cleric = require('./classes/cleric.js');

// Enemies
const Test = require('./enemies/test.js');

const GAME_PREPARING = 'preparing';
const GAME_PLAYING = 'playing';

class Game {
  constructor(data) {
    this.room = data;
    this.state = GAME_PREPARING; // cycle: preparing -> playing -> (loop)
    this.lastUpdate = new Date().getTime();
    this.dt = 0;

    this.players = {};
    this.enemy = new Test(1, 1);
    this.enemyLevel = 1;
    this.bullets = []; // bullets are in enemy object - only has pos, radius, and drained value?

    // only nessesary data to set each update
    this.clientPlayers = {};
    this.clientEnemy = {};
    this.clientEmitter = [];
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

    this.enemyLevel = 1;
    this.enemy = new Test(this.enemyLevel, keys.length);

    this.bullets = []; // bullets are in enemy object - only has pos, radius, and drained value?
    this.clientBullets = [];

    for (let i = 0; i < keys.length; i++) {
      let color = {};
      const player = this.players[keys[i]];

      // set player color
      if (i === 0) {
        color = {
          sprite: 0,
          r: 255,
          g: 0,
          b: 0,
        };
      } else if (i === 1) {
        color = {
          sprite: 1,
          r: 0,
          g: 255,
          b: 0,
        };
      } else if (i === 2) {
        color = {
          sprite: 2,
          r: 0,
          g: 255,
          b: 255,
        };
      } else {
        color = {
          sprite: 3,
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

      // set character class default to fighter
      if (player.type === 'fighter') {
        this.players[player.hash] = new Fighter(user, pos, color);
      } else if (player.type === 'bomber') {
        this.players[player.hash] = new Bomber(user, pos, color);
      } else if (player.type === 'cleric') {
        this.players[player.hash] = new Cleric(user, pos, color);
      } else if (player.type === 'aura') {
        this.players[player.hash] = new Aura(user, pos, color);
      } else {
        this.players[player.hash] = new Fighter(user, pos, color);
      }
    }
  }

  // move collision and update function to collision.js (child process)
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
          player.energy = Math.min(player.energy + 1, player.maxEnergy);
          player.currentExp++;
          bullet.drained = true;

          // check if player should level up
          if (player.currentExp >= player.exp) {
            player.levelUp();

            // emit updated info to players
            process.send(new Message('levelPlayer', {
              hash: player.hash,
              player: player.getMaxStats(),
            }));
          }
        }

        // check if bullet is colliding with player
        if (distance < (player.hitbox + bullet.radius)) {
          player.hp -= this.enemy.damage;
          player.isHit = true;
          player.hit = player.invul;
          player.energy = Math.max(player.energy - 2, 0);

          bullet.active = false;

          // check if player died
          if (player.hp <= 0) {
            player.hp = 0;
            player.energy = 0;
            player.currentExp = Math.round(player.currentExp * 0.5);
            player.isAlive = false;
            player.reviveTimer = player.reviveTime;

            // send message with new isAlive value
            process.send(new Message('playerIsAlive', {
              hash: player.hash,
              isAlive: player.isAlive,
              reviveTimer: player.reviveTimer,
              reviveTime: player.reviveTime,
            }));
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
    }

    // if all players ready emit new room info emit updated info back
    if (keys.length === readyPlayers) {
      this.state = GAME_PLAYING;
      this.setupGame();

      process.send(new Message('startGame', {
        state: this.state,
        players: this.players,
        enemy: this.enemy.getClientData(),
        bullets: this.clientBullets,
      }));
    }
  }

  // update enemy, checks collision, checks if players are dead
  playing() {
    const keys = Object.keys(this.players);
    let deadPlayers = 0;

    // if enemy is dead - create new one and reward players
    // else loop through player for collisions
    if (!this.enemy || this.enemy.hp <= 0) {
      // reward players - heal and exp
      for (let i = 0; i < keys.length; i++) {
        const player = this.players[keys[i]];

        player.currentExp += player.exp * 0.25;
        player.hp = Math.min(player.hp + (player.maxHp * 0.2), player.maxHp);

        // check if they level up
        if (player.currentExp > player.exp) {
          player.levelUp();

          // emit updated info to players
          process.send(new Message('levelPlayer', {
            hash: player.hash,
            player: player.getMaxStats(),
          }));
        }
      }

      // create new enemy
      // TO DO: pick random enemy type and str depends on player level
      this.bullets = [];
      this.enemyLevel++;
      this.enemy = new Test(this.enemyLevel, keys.length);
    } else {
      this.enemy.update(this.dt);

      // loop through players
      for (let i = 0; i < keys.length; i++) {
        const player = this.players[keys[i]];

        if (player.isAlive) {
          // dont check collision if hit
          if (player.hit > 0) {
            player.hit -= this.dt;
          } else {
            player.isHit = false;
            this.checkCollision(player);
          }

          // charge basic attack if not usable
          if (player.currentAttRate > 0) {
            player.currentAttRate -= this.dt;
          } else {
            player.currentAttRate = 0;
          }


          if (player.attacking) {
            const range = (player.maxDamage - player.minDamage) + 1;

            this.enemy.hp -= utils.getRandomInt(range, player.minDamage);

            // deal another strike if its critcal
            if (player.isCritcalHit) {
              this.enemy.hp -= utils.getRandomInt(range, player.minDamage);
            }

            player.attacking = false;
            player.currentAttRate = player.attRate;

            // TO DO: ADD emit to rpc attack animation if attacking is true
            process.send(new Message('playerAttacking', {
              pos: this.enemy.pos,
              isCritcalHit: player.isCritcalHit,
            }));
          }
          // check skill used
          if (player.skill1Used) {
            player.skill1(this.enemy, this.players, this.bullets);

            process.send(new Message('playerUsedSkill', {
              hash: player.hash,
              skillName: player.skill1Name,
              pos: this.enemy.pos,
            }));
          }
          if (player.skill2Used) {
            player.skill2(this.enemy, this.players, this.bullets);

            // do not run if its a toggle type skill
            if (!player.skill2IsToggleType) {
              process.send(new Message('playerUsedSkill', {
                hash: player.hash,
                skillName: player.skill2Name,
                pos: this.enemy.pos,
              }));
            }
          }
        } else {
          deadPlayers++;
          player.reviveTimer -= this.dt;

          // revive player when revive timer ends
          if (player.reviveTimer <= 0) {
            player.reviveTimer = 0;
            player.reviveTime += 5; // extend next revive time by 5 sec
            player.isAlive = true;
            player.hp = player.maxHp;

            // send message with new isAlive value
            process.send(new Message('playerIsAlive', {
              hash: player.hash,
              isAlive: player.isAlive,
              reviveTimer: player.reviveTimer,
              reviveTime: player.reviveTime,
            }));
          }
        }

        // update player's critcal hit location
        player.update(this.dt);

        this.clientPlayers[keys[i]] = player.getClientData();
      }
    }

    this.bullets = this.enemy.bullets;

    this.clientEmitters = this.enemy.emitters.map(emitter => ({
      pos: emitter.pos,
      sprite: emitter.sprite,
    }));

    // filter bullets data to send only necessary info
    this.clientBullets = this.bullets.map(bullet => ({
      pos: bullet.pos,
      radius: bullet.radius,
      drained: bullet.drained,
      sprite: bullet.sprite,
    }));

    this.state = keys.length === deadPlayers ? GAME_PREPARING : this.state;

    // emit updated info back
    process.send(new Message('updateRoom', {
      state: this.state,
      players: this.clientPlayers,
      enemy: this.enemy.getClientData(),
      emitters: this.clientEmitters,
      bullets: this.clientBullets,
    }));
  }

  // update dt and game based on state
  update() {
    const now = new Date().getTime();

    // in sec
    this.dt = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    if (this.state === GAME_PREPARING) {
      this.preparing();
    } else if (this.state === GAME_PLAYING) {
      this.playing();
    } else {
      console.log(`unknown state: ${this.state}`);
      this.state = GAME_PREPARING;
    }
  }
}

module.exports = Game;
