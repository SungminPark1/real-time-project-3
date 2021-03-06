const Enemy = require('../enemy.js');
const Emitter = require('../emitter.js');
const utils = require('../../utils.js');

class Star extends Enemy {
  constructor(level, playerNum) {
    super();
    this.hp = 100 + (50 * level * playerNum);
    this.maxHp = 100 + (50 * level * playerNum);
    this.damage = 0.5 + (0.5 * level);
    this.difficulty = 0;

    this.patterns = 9;
    this.attackPattern = utils.getRandomInt(this.patterns);

    this.currentAttackDur = 300 + (60 * level);
    this.attackDur = 300 + (60 * level);

    this.currentRestDur = 180;
    this.restDur = 180;
  }

  // spread (shotgun)
  pattern0() {
    if (this.currentAttackDur === this.attackDur) {
      const pos = {
        x: this.pos.x,
        y: 10,
      };
      let spriteColor = utils.getRandomInt(8);
      let offset = utils.getRandomInt(25);

      const emitter = new Emitter(pos, { x: 60, y: 0 }, 25, offset);
      emitter.setSprite(spriteColor);
      emitter.addSpread(180, 3, true);
      this.emitters.push(emitter);

      spriteColor = utils.getRandomInt(8);
      offset = utils.getRandomInt(40);

      const emitter2 = new Emitter(pos, { x: 100, y: 0 }, 40, offset);
      emitter2.setSprite(spriteColor);
      emitter2.setBulletSprite(16, 0, 8, true);
      emitter2.addSpread(180, 3, true);
      this.emitters.push(emitter2);
    }
  }

  // spin
  pattern1() {
    if (this.currentAttackDur === this.attackDur) {
      const offset = utils.getRandomInt(6);
      let spriteColor = utils.getRandomInt(8);

      const emitter = new Emitter(this.pos, { x: 0, y: 75 }, 6, offset);
      emitter.setSprite(spriteColor);
      emitter.addSpin(1, 0.1, { max: 40, min: -40 }, true);
      this.emitters.push(emitter);

      spriteColor = utils.getRandomInt(8);

      const emitter2 = new Emitter(this.pos, { x: 0, y: -75 }, 6, offset);
      emitter2.setSprite(spriteColor);
      emitter2.addSpin(1, 0.1, { max: 40, min: -40 }, true);
      this.emitters.push(emitter2);
    }
  }

  // spread + spin
  pattern2() {
    if (this.currentAttackDur === this.attackDur) {
      let spriteColor = utils.getRandomInt(8);
      let offset = utils.getRandomInt(20);

      const emitter = new Emitter(this.pos, { x: -50, y: -50 }, 20, offset);
      emitter.setSprite(spriteColor);
      emitter.setBulletSprite(32, 0, 1, true);
      emitter.addSpread(90, 3);
      emitter.addSpin(2);
      this.emitters.push(emitter);

      spriteColor = utils.getRandomInt(8);
      offset = utils.getRandomInt(10);

      const emitter2 = new Emitter(this.pos, { x: 75, y: 75 }, 10, offset);
      emitter2.setSprite(spriteColor);
      emitter2.setBulletSprite(16, 0, 0, true);
      emitter2.addSpread(90, 3);
      emitter2.addSpin(-2);
      this.emitters.push(emitter2);
    }
  }

  // spin + bullet accel
  pattern3() {
    if (this.currentAttackDur === this.attackDur) {
      const offset = utils.getRandomInt(6);
      let spriteColor = utils.getRandomInt(8);

      const emitter = new Emitter(this.pos, { x: 0, y: 75 }, 6, offset);
      emitter.setSprite(spriteColor);
      emitter.addSpin(0, 0.5, { max: 40, min: -40 }, true);
      emitter.addBulletAccel(-1);
      this.emitters.push(emitter);

      spriteColor = utils.getRandomInt(8);

      const emitter2 = new Emitter(this.pos, { x: 0, y: 75 }, 6, offset);
      emitter2.setSprite(spriteColor);
      emitter2.addSpin(0, -0.5, { max: 40, min: -40 }, true);
      emitter2.addBulletAccel(-1);

      this.emitters.push(emitter2);
    }
  }

  // bullet rain
  pattern4() {
    if (this.currentAttackDur === this.attackDur) {
      const posLimit = {
        min: { x: 5, y: 0 },
        max: { x: 635, y: 520 },
      };
      const pos = {
        x: utils.getRandomInt(630) + 5,
        y: 10,
      };
      let spriteColor = utils.getRandomInt(8);
      let offset = utils.getRandomInt(30);

      const emitter = new Emitter(pos, { x: 0, y: 1 }, 20, offset);
      emitter.setSprite(spriteColor);
      emitter.setBulletSprite(16, 0, 0, true);
      emitter.addVel({ x: 150, y: 0 }, true, posLimit);
      emitter.addAccel(0.5);
      emitter.addBulletAccel(0.33);
      this.emitters.push(emitter);

      pos.x = utils.getRandomInt(620);
      spriteColor = utils.getRandomInt(8);
      offset = utils.getRandomInt(30);

      const emitter2 = new Emitter(pos, { x: 0, y: 1 }, 20, offset);
      emitter2.setSprite(spriteColor);
      emitter2.setBulletSprite(16, 0, 2, true);
      emitter2.addVel({ x: 150, y: 0 }, true, posLimit);
      emitter2.addAccel(0.75);
      emitter2.addBulletAccel(0.66);
      this.emitters.push(emitter2);

      pos.x = utils.getRandomInt(620);
      spriteColor = utils.getRandomInt(8);
      offset = utils.getRandomInt(30);

      const emitter3 = new Emitter(pos, { x: 0, y: 1 }, 20, offset);
      emitter3.setSprite(spriteColor);
      emitter3.setBulletSprite(16, 0, 8, true);
      emitter3.addVel({ x: -150, y: 0 }, true, posLimit);
      emitter3.addAccel(1);
      emitter3.addBulletAccel(1);
      this.emitters.push(emitter3);
    }
  }

  // spin + bullet curve
  // interesting but hard to control
  pattern5() {
    if (this.currentAttackDur === this.attackDur) {
      const pos = { ...this.pos };
      pos.y -= 20;
      const offset = utils.getRandomInt(10);
      let spriteColor = utils.getRandomInt(8);

      const emitter = new Emitter(pos, { x: 0, y: 100 }, 10, offset);
      emitter.setSprite(1);
      emitter.setBulletSprite(16, 0, 0, true);
      emitter.addSpin(1, 0, { max: 40, min: -40 }, true);
      emitter.addBulletCurve(1, { max: 30, min: -30 }, true);
      this.emitters.push(emitter);

      spriteColor = utils.getRandomInt(8);
      const emitter2 = new Emitter(pos, { x: 50, y: 50 }, 50);
      emitter2.setSprite(spriteColor);
      emitter2.setBulletSprite(16, 0, 8, true);
      emitter2.addSpread(90, 3, true);
      this.emitters.push(emitter2);

      spriteColor = utils.getRandomInt(8);
      const emitter3 = new Emitter(pos, { x: 150, y: 0 }, 50);
      emitter3.setSprite(spriteColor);
      emitter3.setBulletSprite(64, 0, 1, true);
      emitter3.addSpread(45, 3);
      this.emitters.push(emitter3);

      spriteColor = utils.getRandomInt(8);
      const emitter4 = new Emitter(pos, { x: -100, y: 100 }, 50);
      emitter4.setSprite(spriteColor);
      emitter4.setBulletSprite(64, 0, 1, true);
      emitter4.addSpread(45, 3);
      this.emitters.push(emitter4);
    }
  }

  // spread (shogun) + bullet curve
  pattern6() {
    if (this.currentAttackDur === this.attackDur) {
      let offset = utils.getRandomInt(30);

      const emitter = new Emitter({ x: this.pos.x, y: 20 }, { x: 75, y: 32.5 }, 40, offset);
      emitter.setSprite(1);
      emitter.setBulletSprite(16, 2, 0);
      emitter.addSpread(130, 4);
      emitter.addSpin(0.1, 0, { max: 5, min: -10 }, true);
      emitter.addBulletCurve(1, { max: 40, min: -40 }, true);
      this.emitters.push(emitter);

      offset = utils.getRandomInt(30);
      const emitter2 = new Emitter({ x: 20, y: 20 }, { x: 100, y: 0 }, 40, offset);
      emitter2.setSprite(4);
      emitter2.setBulletSprite(16, 7, 0);
      emitter2.addSpread(90, 1, true);
      emitter2.addBulletCurve(1, { max: 40, min: -40 }, true);
      this.emitters.push(emitter2);

      offset = utils.getRandomInt(30);
      const emitter3 = new Emitter({ x: 620, y: 20 }, { x: 0, y: 100 }, 40, offset);
      emitter3.setSprite(5);
      emitter3.setBulletSprite(16, 9, 0);
      emitter3.addSpread(90, 1, true);
      emitter3.addBulletCurve(1, { max: 40, min: -40 }, true);
      this.emitters.push(emitter3);
    }
  }

  // bullet accel + bullet curve + spin
  // interesting but hard to control
  pattern7() {
    if (this.currentAttackDur === this.attackDur) {
      const posLimit = {
        min: { x: this.pos.x - 80, y: 0 },
        max: { x: 620, y: 520 },
      };
      let spriteColor = utils.getRandomInt(8);
      let offset = utils.getRandomInt(15);

      const emitter = new Emitter(this.pos, { x: 0, y: -100 }, 15, offset);
      emitter.setSprite(spriteColor);
      emitter.addVel({ x: 100, y: 0 }, true, posLimit);
      emitter.addBulletCurve(0.5);
      emitter.addBulletAccel(-1);
      emitter.addSpin(1, 0, { max: 30, min: -30 }, true);
      emitter.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter);

      posLimit.min = { x: 20, y: 0 };
      posLimit.max = { x: this.pos.x + 80, y: 520 };
      spriteColor = utils.getRandomInt(8);
      offset = utils.getRandomInt(15);
      const emitter2 = new Emitter(this.pos, { x: 0, y: -100 }, 15, offset);
      emitter2.setSprite(spriteColor);
      emitter2.addVel({ x: -100, y: 0 }, true, posLimit);
      emitter2.addBulletCurve(-0.5);
      emitter2.addBulletAccel(-1);
      emitter2.addSpin(-1, 0, { max: 30, min: -30 }, true);
      emitter2.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter2);
    }
  }

  // velocity + spin + bullet accel
  pattern8() {
    if (this.currentAttackDur === this.attackDur) {
      const posLimit = {
        min: { x: 0, y: 20 },
        max: { x: 640, y: 520 },
      };
      let spriteColor = utils.getRandomInt(8);
      let offset = utils.getRandomInt(15);

      const emitter = new Emitter({ x: 20, y: 20 }, { x: 0, y: 1 }, 15, offset);
      emitter.setSprite(spriteColor);
      emitter.setBulletSprite(16, 0, 0, true);
      emitter.addVel({ x: 0, y: 50 }, true, posLimit);
      emitter.addSpin(-2, 0, { max: 1, min: -180 }, true);
      emitter.addBulletAccel(0.5);

      this.emitters.push(emitter);

      spriteColor = utils.getRandomInt(8);
      offset = utils.getRandomInt(15);
      const emitter2 = new Emitter({ x: 620, y: 520 }, { x: 0, y: 1 }, 15, offset);
      emitter2.setSprite(spriteColor);
      emitter2.setBulletSprite(16, 0, 0, true);
      emitter2.addVel({ x: 0, y: -50 }, true, posLimit);
      emitter2.addSpin(2, 0, { max: 180, min: -1 }, true);
      emitter2.addBulletAccel(0.5);

      this.emitters.push(emitter2);

      spriteColor = utils.getRandomInt(8);
      const emitter3 = new Emitter(this.pos, { x: 60, y: 0 }, 59);
      emitter3.setSprite(spriteColor);
      emitter3.setBulletSprite(32, 0, 1, true);
      emitter3.addSpread(180, 3, true);

      this.emitters.push(emitter3);
    }
  }

  update(dt) {
    // updates bullets and emitters
    super.update(dt);

    // if resting is less 0 - enemy is attacking
    if (this.currentRestDur <= 0) {
      // update pattern
      if (this.attackPattern === 0) {
        this.pattern0();
      } else if (this.attackPattern === 1) {
        this.pattern1();
      } else if (this.attackPattern === 2) {
        this.pattern2();
      } else if (this.attackPattern === 3) {
        this.pattern3();
      } else if (this.attackPattern === 4) {
        this.pattern4();
      } else if (this.attackPattern === 5) {
        this.pattern5();
      } else if (this.attackPattern === 6) {
        this.pattern6();
      } else if (this.attackPattern === 7) {
        this.pattern7();
      } else if (this.attackPattern === 8) {
        this.pattern8();
      }

      this.currentAttackDur--;

      // check if it should go into rest and then start another attack
      if (this.currentAttackDur <= 0) {
        this.currentAttackDur = this.attackDur;
        this.currentRestDur = this.restDur;

        // kill old emitters
        this.emitters = [];

        // set new pattern
        const oldPattern = this.attackPattern;
        this.attackPattern = utils.getRandomInt(this.patterns);

        if (oldPattern === this.attackPattern) {
          this.attackPattern = utils.getRandomInt(this.patterns);
        }
      }
    } else {
      this.currentRestDur--;
    }
  }
}

module.exports = Star;
