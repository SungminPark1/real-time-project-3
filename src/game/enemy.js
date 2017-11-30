class Enemy {
  constructor() {
    this.pos = { x: 320, y: 60 };
    this.hp = 100;
    this.maxHp = 100;
    this.damage = 1;
    this.difficulty = 0;
    this.emitters = [];
    this.bullets = [];

    this.attackPattern = 0;
    this.currentAttackDur = 300;
    this.attackDur = 300;

    this.currentRestDur = 180;
    this.restDur = 180;

    this.lastRotation = 0;
    this.startIndex = 0;

    // data only clients would need for draw
    this.clientEmitters = [];
  }

  update(dt) {
    // update bullets
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update(dt);
    }

    // filter non-active bullets
    this.bullets = this.bullets.filter(bullet => bullet.active);

    // update emitters
    for (let i = 0; i < this.emitters.length; i++) {
      const emitter = this.emitters[i];

      // update emitter, add emitter bullets to enemy bullets, clear emitter bullets
      emitter.update(dt);
      this.bullets = this.bullets.concat(emitter.bullets);
      emitter.bullets = [];
    }

    // filter emitters
    this.emitters = this.emitters.filter(emitter => emitter.active);
  }

  getClientData() {
    const { hp, maxHp, damage } = this;

    return { hp, maxHp, damage };
  }
}

module.exports = Enemy;
