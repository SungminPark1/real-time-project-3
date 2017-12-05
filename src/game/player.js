const Message = require('../message.js');

class Player {
  constructor(user) {
    this.hash = user.hash;
    this.id = user.id;
    this.name = user.name;
    this.lastUpdate = new Date().getTime();
    this.ready = false;
    this.pos = {
      x: 0,
      y: 0,
    };
    this.prevPos = { ...this.pos };
    this.destPos = { ...this.pos };
    this.alpha = 0;
    this.color = {
      r: 0,
      g: 0,
      b: 0,
    };
    this.level = 1;

    this.isAlive = true;
    this.reviveTimer = 0;
    this.reviveTime = 5;

    this.hp = 10;
    this.maxHp = 10;

    this.energy = 0;
    this.maxEnergy = 20;

    this.hitbox = 25;
    this.capHitbox = 12;

    this.graze = 15;
    this.capGraze = 30;

    this.attacking = false;
    this.currentAttRate = 600;
    this.attRate = 600;
    this.capAttRate = 60;

    this.maxDamage = 3;
    this.minDamage = 1;

    this.speed = 100;
    this.capSpeed = 200;

    this.isHit = false;
    this.hit = 0;
    this.invul = 0.5;
    this.capInvul = 3;

    this.currentExp = 0;
    this.exp = 10;

    this.skill1Cost = 5;
    this.skill1Used = false;

    this.skill2Cost = 10;
    this.skill2Used = false;
  }

  // data the client needs every update
  // other data is sent when needed
  getClientData() {
    const {
      hash,
      lastUpdate,
      pos,
      destPos,
      prevPos,
      hp,
      energy,
      currentAttRate,
      currentExp,
      isHit,
      reviveTimer,
      skill1Used,
      skill2Used,
    } = this;

    return {
      hash,
      lastUpdate,
      pos,
      destPos,
      prevPos,
      hp,
      energy,
      currentAttRate,
      currentExp,
      isHit,
      reviveTimer,
      skill1Used,
      skill2Used,
    };
  }

  // return max stats
  getMaxStats() {
    const { maxHp, maxEnergy, maxDamage, minDamage, attRate, exp, hitbox, graze } = this;

    return { maxHp, maxEnergy, maxDamage, minDamage, attRate, exp, hitbox, graze };
  }

  updatePreparing(user) {
    this.lastUpdate = new Date().getTime();

    this.type = user.type;

    if (user.toggleReady) {
      this.ready = !this.ready;
    }

    process.send(new Message('playerPreparing', {
      hash: this.hash,
      type: this.type,
      ready: this.ready,
    }));
  }

  updatePlaying(user) {
    this.lastUpdate = new Date().getTime();

    this.pos = user.pos;
    this.prevPos = user.prevPos;
    this.destPos = user.destPos;

    if (user.attacking) {
      this.attacking = true;
    }
    if (user.toggleSkill1) {
      this.skill1Used = !this.skill1Used;
    }
    if (user.toggleSkill2) {
      this.skill2Used = !this.skill2Used;
    }
  }
}

module.exports = Player;
