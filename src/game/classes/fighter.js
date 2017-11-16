const Player = require('../player.js');

class Fighter extends Player {
  constructor(user, pos = { x: 250, y: 250 }, color = { r: 255, g: 0, b: 0 }) {
    super(user);
    this.type = 'fighter';
    this.pos = pos;
    this.prevPos = { ...this.pos };
    this.destPos = { ...this.pos };
    this.color = color;
    this.level = 1;

    this.alive = true;
    this.reviveTimer = 0; // change to tick rate?
    this.reviveTime = 5;

    this.hp = 10;
    this.maxHp = 10;

    this.energy = 10;
    this.maxEnergy = 20;
    this.capEnergy = 50;

    this.hitbox = 25;
    this.capHitbox = 12;

    this.graze = 15;
    this.capGraze = 30;

    this.currentAttRate = 5; // change to tick rate?
    this.attRate = 10;
    this.capAttRate = 1;

    this.maxDamage = 3;
    this.minDamage = 1;

    this.speed = 100;
    this.capSpeed = 200;

    this.hit = 0; // change to tick rate?
    this.invul = 0.5;
    this.capInvul = 2;

    this.currentExp = 5;
    this.exp = 10;

    this.skill1Name = 'Final Strike';
    this.skill1Cost = 5;
    this.skill1Used = false;

    this.skill2Name = 'Full Force';
    this.skill2Cost = 10;
    this.skill2Used = false;
  }

  // Final Strike
  skill1(enemy) {
    if (this.energy > this.skill1Cost) {
      const boss = enemy;
      boss.hp -= this.minDamage;

      // heal player by 10% if it kills the enemy
      if (boss.hp <= 0) {
        this.hp = Math.min(this.hp + (this.maxHp * 0.1), this.maxHp);
      }

      this.energy -= this.skill1Cost;
    }
    this.skill1Used = false;
  }

  // Full Force
  skill2(enemy) {
    if (this.energy > this.skill2Cost) {
      const boss = enemy;
      boss.hp -= (this.maxDamage + this.energy) * (this.energy / 7.5);

      // killing the enemy removes healing from enemy kill
      if (boss.hp <= 0) {
        this.hp += -(this.maxHp * 0.2);
      }

      this.energy = 0;
    }
    this.skill2Used = false;
  }

  levelUp() {
    // 17 / 24 stars
    this.level++;

    this.maxHp += 4; // 2 star
    this.hp += 4;

    this.maxEnergy = Math.min((this.maxEnergy + 1), this.energyCap); // 1 star

    this.hitbox = Math.max((this.hitbox - 0.5), this.hitboxCap); // 1 star

    this.grazeRadius = Math.min((this.grazeRadius + 0.5), this.grazeRadiusCap); // 1 star

    this.attackRate = Math.max((this.attackRate - 25), this.attackRateCap); // 3 star

    this.maxDamage += 6; // 3 star

    this.minDamage += 3; // 3 star

    this.speed = Math.min((this.speed + 5), this.speedCap); // 2 star

    this.invul = Math.min((this.invul + 1), this.invulCap); // 1 star

    this.currentExp = 0;
    this.exp += 10;
  }
}

module.exports = Fighter;
