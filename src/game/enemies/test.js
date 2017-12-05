const Enemy = require('../enemy.js');
const Emitter = require('../emitter.js');
const utils = require('../../utils.js');

class Star extends Enemy {
  constructor(level, playerNum) {
    super();
    this.hp = 100 + (50 * level * playerNum);
    this.maxHp = 100 + (50 * level * playerNum);
    this.damage = 1;
    this.difficulty = 0;

    this.patterns = 9;
    this.attackPattern = utils.getRandomInt(this.patterns);

    this.currentAttackDur = 600 + (60 * level);
    this.attackDur = 600 + (60 * level);

    this.currentRestDur = 180;
    this.restDur = 180;
  }

  // spread (shotgun)
  pattern0() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 60, y: 0 }, 20);
      emitter.addSpread(180, 4, true);

      this.emitters.push(emitter);
    }
  }

  // spin
  pattern1() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 0, y: 75 }, 5);
      emitter.addSpin(1, 0.1, { max: 20, min: -20 }, true);

      this.emitters.push(emitter);
    }
  }

  // spread + spin
  pattern2() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: -50, y: -50 }, 20);
      emitter.addSpread(90, 3);
      emitter.addSpin(2);
      emitter.setBulletSprite(32, 0, 1, true);

      this.emitters.push(emitter);

      const emitter2 = new Emitter(this.pos, { x: 75, y: 75 }, 10);
      emitter2.addSpread(90, 3);
      emitter2.addSpin(-2);
      emitter2.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter2);
    }
  }

  // spin + bullet accel
  pattern3() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 0, y: 75 }, 5);
      emitter.addSpin(0, 0.5, { max: 40, min: -40 }, true);
      emitter.addBulletAccel(-1);

      this.emitters.push(emitter);

      const emitter2 = new Emitter(this.pos, { x: 0, y: 75 }, 5);
      emitter2.addSpin(0, -0.5, { max: 40, min: -40 }, true);
      emitter2.addBulletAccel(-1);

      this.emitters.push(emitter2);
    }
  }

  // bullet curve
  pattern4() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 0, y: 100 }, 10);
      // emitter.addBulletCurve(0.5);
      emitter.addBulletCurve(1, { max: 30, min: -30 }, true);

      this.emitters.push(emitter);
    }
  }

  // spin + bullet curve
  // interesting but hard to control
  pattern5() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 0, y: 100 }, 10);
      emitter.addSpin(1, 0, { max: 40, min: -40 }, true);
      emitter.addBulletCurve(1, { max: 30, min: -30 }, true);
      emitter.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter);
    }
  }

  // spread (shogun) + bullet curve
  pattern6() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 100, y: 0 }, 15);
      // emitter.addBulletCurve(0.5);
      emitter.addSpread(180, 3, true);
      emitter.addBulletCurve(1, { max: 40, min: -40 }, true);
      emitter.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter);
    }
  }

  // bullet accel + bullet curve + spin
  // interesting but hard to control
  pattern7() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter(this.pos, { x: 0, y: -100 }, 15);
      // emitter.addBulletCurve(0.5);
      emitter.addBulletCurve(0.5);
      emitter.addBulletAccel(-1);
      emitter.addSpin(1, 0, { max: 30, min: -30 }, true);
      emitter.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter);

      const emitter2 = new Emitter(this.pos, { x: 0, y: -100 }, 15);
      // emitter.addBulletCurve(0.5);
      emitter2.addBulletCurve(-0.5);
      emitter2.addBulletAccel(-1);
      emitter2.addSpin(-1, 0, { max: 30, min: -30 }, true);
      emitter2.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter2);
    }
  }

  // add reversal effect to velocity
  // velocity + spin + bullet accel
  pattern8() {
    if (this.currentAttackDur === this.attackDur) {
      const emitter = new Emitter({ x: 20, y: 20 }, { x: 0, y: 1 }, 20);
      emitter.addVel({ x: 0, y: 35 });
      emitter.addSpin(-2, 0, { max: 1, min: -180 }, true);
      emitter.addBulletAccel(0.5);
      emitter.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter);

      const emitter2 = new Emitter({ x: 620, y: 20 }, { x: 0, y: 1 }, 20);
      emitter2.addVel({ x: 0, y: 35 });
      emitter2.addSpin(2, 0, { max: 180, min: -1 }, true);
      emitter2.addBulletAccel(0.5);
      emitter2.setBulletSprite(16, 0, 0, true);

      this.emitters.push(emitter2);
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
