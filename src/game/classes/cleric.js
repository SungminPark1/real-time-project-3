const Player = require('../player.js');

class Cleric extends Player {
  constructor(user, pos = { x: 250, y: 250 }, color = { r: 255, g: 0, b: 0 }) {
    super(user);
    this.type = 'cleric';
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

    this.hitbox = 23;
    this.capHitbox = 10;

    this.graze = 15;
    this.capGraze = 35;

    this.currentAttRate = 10; // change to tick rate?
    this.attRate = 10;
    this.capAttRate = 1;

    this.maxDamage = 3;
    this.minDamage = 1;

    this.speed = 75;
    this.capSpeed = 200;

    this.isHit = false;
    this.hit = 0; // change to tick rate?
    this.invul = 0.5;
    this.capInvul = 3;

    this.currentExp = 0;
    this.exp = 10;

    this.skill1Name = 'Smite';
    this.skill1Cost = 15;
    this.smiteDmg = 0.04;
    this.capSmiteDmg = 0.5;
    this.skill1Used = false;

    this.skill2Name = 'Hp Regen';
    this.skill2Cost = 0.1;
    this.hpRegen = 0.02;
    this.capHpRegen = 0.5;
    this.skill2Used = false;
  }

  // Smite
  // damage based on bosses hp, min damage is player's min damage
  skill1(enemy) {
    if (this.energy > this.skill1Cost) {
      const boss = enemy;
      boss.hp -= Math.max(this.minDamage, boss.hp * this.smiteDmg);

      this.energy -= this.skill1Cost;
    }
    this.skill1Used = false;
  }

  // Hp Regen
  skill2(enemy, players) {
    if (this.energy > this.skill2Cost) {
      const keys = Object.keys(players);

      for (let i = 0; i < keys.length; i++) {
        const player = players[keys[i]];

        player.hp = Math.min(player.hp + this.hpRegen, player.maxHp);
      }

      this.energy -= 0.1;
    } else {
      this.skill2Used = false;
    }
  }

  levelUp() {
    // 16 star
    this.level++;

    this.maxHp += 4; // 2 star
    this.hp += 4;

    this.maxEnergy += 2; // 2 star

    this.hitbox = Math.max((this.hitbox - 0.5), this.capHitbox); // 1 star

    this.graze = Math.min((this.graze + 1), this.capGraze); // 2 star

    this.attRate = Math.max((this.attRate - 0.3), this.capAttRate); // 3 star

    this.maxDamage += 4; // 3 star
    this.minDamage += 1; // 1 star

    this.speed = Math.min((this.speed + 2.5), this.capSpeed); // 1 star

    this.invul = Math.min((this.invul + 0.05), this.capInvul); // 1 star

    this.smiteDmg = Math.min(this.smiteDmg + 0.02, this.capSmiteDmg);

    this.hpRegen = Math.min(this.hpRegen + 0.01, this.capHpRegen);

    this.currentExp = 0;
    this.exp += 5;
  }
}

module.exports = Cleric;
