// clean up code
class Player {
  constructor(user) {
    this.hash = user.hash;
    this.name = user.name;
    this.lastUpdate = new Date().getTime();
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

    this.alive = true;
    this.reviveTimer = 0;
    this.reviveTime = 1200;

    this.hp = 10;
    this.maxHp = 10;

    this.energy = 0;
    this.maxEnergy = 20;
    this.capEnergy = 50;

    this.hitbox = 25;
    this.capHitbox = 12;

    this.graze = 15;
    this.capGraze = 30;

    this.currentAttRate = 600;
    this.attRate = 600;
    this.capAttRate = 60;

    this.maxDamage = 3;
    this.minDamage = 1;

    this.speed = 100;
    this.capSpeed = 200;

    this.hit = 0;
    this.invul = 30;
    this.capInvul = 120;

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
      hit,
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
      hit,
    };
  }

  update(user) {
    this.lastUpdate = new Date().getTime();

    this.pos = user.pos;
    this.prevPos = user.prevPos;
    this.destPos = user.destPos;

    // this.usedSkill = user.usedSkill;
  }

  toggleReady(user) {
    this.ready = user.ready;
  }
}

module.exports = Player;
