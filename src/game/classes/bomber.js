const Player = require('../player.js');
const utils = require('../../utils.js');

class Bomber extends Player {
  constructor(user, pos = { x: 250, y: 250 }, color = { sprite: 0, r: 255, g: 0, b: 0 }) {
    super(user);
    this.type = 'bomber';
    this.ready = false;
    this.pos = pos;
    this.prevPos = { ...this.pos };
    this.destPos = { ...this.pos };
    this.color = color;
    this.level = 1;

    this.isAlive = true;
    this.reviveTimer = 0; // change to tick rate?
    this.reviveTime = 5;

    this.hp = 10;
    this.maxHp = 10;

    this.energy = 0;
    this.maxEnergy = 20;

    this.hitbox = 25;
    this.capHitbox = 10;

    this.graze = 20;
    this.capGraze = 45;

    this.currentAttRate = 10; // change to tick rate?
    this.attRate = 10;
    this.capAttRate = 1;

    this.maxDamage = 3;
    this.minDamage = 1;

    this.speed = 80;
    this.capSpeed = 200;

    this.isHit = false;
    this.hit = 0; // change to tick rate?
    this.invul = 0.5;
    this.capInvul = 3;

    this.currentExp = 0;
    this.exp = 10;

    // CHANGE SKILL NAME
    this.skill1Name = 'bs1';
    this.skill1Cost = 10;
    this.skill1Used = false;

    this.skill2Name = 'bs2';
    this.skill2Cost = 20;
    this.clearChance = 30;
    this.capClearChance = 90;
    this.skill2Used = false;
  }

  // clear bombs in x2 radius and deal max damage?
  skill1(enemy, players, bullets) {
    if (this.energy >= this.skill1Cost) {
      const boss = enemy;
      let enemyBullets = bullets;

      // clear bombs in range
      for (let i = 0; i < enemyBullets.length; i++) {
        const bullet = enemyBullets[i];
        const distance = utils.circlesDistance(this.pos, bullet.pos);
        const grazeDistance = (2 * (this.hitbox + this.graze)) + bullet.radius;

        if (distance < grazeDistance) {
          bullet.active = false;
        }
      }

      enemyBullets = enemyBullets.filter(bullet => bullet.active);

      boss.hp -= this.maxDamage;
      this.energy -= this.skill1Cost;
    }
    this.skill1Used = false;
  }

  // chance to clear bullets whole screen
  skill2(enemy, players, bullets) {
    if (this.energy >= this.skill2Cost) {
      const boss = enemy;
      let enemyBullets = bullets;

      // clear bombs in range
      for (let i = 0; i < enemyBullets.length; i++) {
        const bullet = enemyBullets[i];
        const num = utils.getRandomInt(100); // 0 ~ 99

        if (num < this.clearChance) {
          bullet.active = false;
        }
      }

      enemyBullets = enemyBullets.filter(bullet => bullet.active);

      boss.hp -= this.minDamage;
      this.energy -= this.skill1Cost;
    }
    this.skill2Used = false;
  }

  levelUp() {
    // 16 stars
    this.level++;

    this.maxHp += 6; // 3 star
    this.hp += 6;

    this.maxEnergy += 2; // 2 star

    this.hitbox = Math.max((this.hitbox - 0.5), this.capHitbox);

    this.graze = Math.min((this.graze + 1), this.capGraze); // 2 star

    this.attRate = Math.max((this.attRate - 0.2), this.capAttRate); // 2 star

    this.maxDamage += 3; // 2 star
    this.minDamage += 2; // 2 star

    this.speed = Math.min((this.speed + 2), this.capSpeed); // 1 star

    this.invul = Math.min((this.invul + 0.1), this.capInvul); // 2 star

    this.clearChance = Math.min((this.clearChance + 2), this.capClearChance);

    this.currentExp = 0;
    this.exp += 5;
  }
}

module.exports = Bomber;
