const Victor = require('victor');
const Bullet = require('./bullet.js');
const utils = require('../utils.js');

class Enemy {
  constructor(level) {
    this.hp = 25 + (25 * level);
    this.maxHp = 25 + (25 * level);
    this.damage = 0;
    this.difficulty = 0;
    this.emitters = [];
    this.bullets = [];

    this.attackPattern = 0;
    this.currentAttackDur = 300;
    this.attackDur = 300;

    this.currentRestDur = 60;
    this.restDur = 60;

    this.lastRotation = 0;
    this.startIndex = 0;

    // data only clients would need for draw
    this.clientEmitters = [];
    this.clientBullets = [];
  }

  // TO DO: pattern creates emitter -> update emitter in update ->
  // add new bullets in emitter to bullets array -> empty emitter bullet array ->
  // update bullets array
  pattern1() {
    /* TO DO: Create Emitter Class
      if (this.currentAttackDur === this.attackDur) {
        // TO DO: Create first emitter
      }
    */
    if (this.currentAttackDur % 10 === 0) {
      const pos = new Victor(320, 50);
      const vel = new Victor(utils.getRandomInt(11, -5), utils.getRandomInt(5, 1));

      this.bullets.push(new Bullet(pos, vel, 10));
    }
  }

  update(dt) {
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].update(dt);
    }

    // filter non-active bullets
    this.bullets = this.bullets.filter(bullet => bullet.active);

    // TO DO: move this out of enemy and into specific enemy with set patterns
    // if resting is less 0 - enemy is attacking
    if (this.currentRestDur <= 0) {
      // update pattern
      if (this.attackPattern === 0) {
        this.pattern1();
      }

      this.currentAttackDur--;

      // check if it should go into rest and then start another attack
      if (this.currentAttackDur <= 0) {
        this.currentAttackDur = this.attackDur;
        this.currentRestDur = this.restDur;

        // TO DO: update int value to match # of patterns
        // this.attackPattern = utils.getRandomInt(1);
      }
    } else {
      this.currentRestDur--;
    }
  }
}

module.exports = Enemy;