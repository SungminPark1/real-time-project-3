const Player = require('../player.js');
const utils = require('../../utils.js');

// low damage and slow attack rate
// small hitbox and large graze
// low health and high energy
// high skill damage

class Aura extends Player {
  constructor(user, pos = { x: 250, y: 250 }, color = { r: 255, g: 0, b: 0 }) {
    super(user);
    this.type = 'aura';
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
    this.capGraze = 50;

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

    this.skill1Name = 'Fireball';
    this.skill1Cost = 15;
    this.skill1Used = false;

    this.skill2Name = 'Fire Storm';
    this.skill2DoT = 0.1;
    this.skill2Cost = 0.1;
    this.skill2Used = false;
  }

  // Fireball
  skill1(enemy, players, bullets) {
    if (this.energy >= this.skill1Cost) {
      const boss = enemy;
      let enemyBullets = bullets;

      for (let i = 0; i < enemyBullets.length; i++) {
        const bullet = enemyBullets[i];
        const distance = utils.circlesDistance(enemy.pos, bullet.pos);

        if (distance < this.hitbox + this.graze) {
          bullet.active = false;
        }
      }

      enemyBullets = enemyBullets.filter(bullet => bullet.active);

      boss.hp -= this.minDamage * (this.energy / 10);
      this.energy -= this.skill1Cost;
    }
    this.skill1Used = false;
  }

  // Fire Storm - remains active until out of energy or player cancels
  skill2(enemy) {
    if (this.energy >= this.skill2Cost) {
      const boss = enemy;

      boss.hp -= this.skill2DoT;
      this.energy -= 0.1;
    } else {
      this.skill2Used = false;
    }
  }

  levelUp() {
    // 16 star
    this.level++;

    this.maxHp += 2; // 1 star
    this.hp += 2;

    this.maxEnergy += 3; // 3 star

    this.hitbox = Math.max((this.hitbox - 0.5), this.capHitbox);

    this.graze = Math.min((this.graze + 1.5), this.capGraze); // 3 star

    this.attRate = Math.max((this.attRate - 0.1), this.capAttRate); // 1 star

    this.maxDamage += 2; // 1 star
    this.minDamage += 1; // 1 star

    this.speed = Math.min((this.speed + 4), this.capSpeed); // 3 star

    this.invul = Math.min((this.invul + 0.15), this.capInvul); // 3 star

    this.skill2DoT += 0.03;

    this.currentExp = 0;
    this.exp += 5;
  }
}

module.exports = Aura;
