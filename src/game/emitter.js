const Victor = require('victor');
const Bullet = require('./bullet.js');
const utils = require('../utils.js');

class Emitter {
  constructor(pos, bulletVel, rate, startOffset = 0) {
    this.pos = new Victor(pos.x, pos.y);
    this.bulletVel = new Victor(bulletVel.x, bulletVel.y);
    this.rate = rate;
    this.currentRate = startOffset;
    this.bullets = [];
    this.active = true;
  }

  // currently only thinking of 1 type of emitter
  // x = 0 ~ 7
  setSprite(x) {
    this.sprite = {
      type: 32,
      x,
      y: 0,
    };
  }

  // checks if emitter should be marked to remove
  inBounds() {
    if (this.pos.x <= -50 || this.pos.x > 690 || this.pos.y <= -50 || this.pos.y > 690) {
      this.active = false;
    }
  }

  // set specific bullet sprite
  setBulletSprite(type, x, y, randX = false) {
    this.bulletSprite = {
      type,
      x,
      y,
      randX,
    };
  }

  // add spread to emitter
  // bullets will be evenly spread out within the spread angle
  // ex: 90 deg and 3 shot =  bullets travel in 0, 45, and 90 deg
  // shotgun will override, bullets have random velocity within the spread angle
  addSpread(angle, shotNum = 1, shotgun = false) {
    this.hasSpread = true;
    this.shotgun = shotgun;
    this.spreadAngle = angle;
    this.shotNum = shotNum;
  }

  // add spin to emitter
  // emitter rotates bullet vel
  addSpin(speed, accel = 0, limit = null, reversal = false) {
    this.hasSpin = true;
    this.totalSpin = 0;
    this.spinSpeed = speed;

    // option control
    this.spinAccel = accel;
    this.spinLimit = limit;
    this.spinReversal = reversal;
  }

  updateSpin() {
    // if there is a limit and spin accel - atLimit checks spinSpeed
    // if there is a limit and no spin accel - atLimit checks total spin
    if (this.spinLimit && this.spinAccel !== 0) {
      const atLimit = this.spinSpeed >= this.spinLimit.max || this.spinSpeed <= this.spinLimit.min;

      if (atLimit && this.spinReversal) {
        this.spinAccel *= -1;
      }
    } else if (this.spinLimit && this.spinAccel === 0) {
      const atLimit = this.totalSpin >= this.spinLimit.max || this.totalSpin <= this.spinLimit.min;

      if (atLimit && this.spinReversal) {
        this.spinSpeed *= -1;
      }
    }

    this.spinSpeed += this.spinAccel;
    this.totalSpin += this.spinSpeed;
    this.bulletVel.rotateDeg(this.spinSpeed);
  }

  // add velocity to emitter
  addVel(vel, reversal = false, posLimit = null) {
    this.hasVel = true;

    this.vel = new Victor(vel.x, vel.y);

    this.velReversal = reversal;
    if (posLimit) {
      this.posMin = posLimit.min;
      this.posMax = posLimit.max;
    }
  }

  updateVel(dt) {
    this.pos.add(new Victor((this.vel.x * dt), (this.vel.y * dt)));

    // if reversable check x and y vel
    // else check if emitter should be removed
    if (this.velReversal) {
      if (this.pos.x < this.posMin.x || this.pos.x > this.posMax.x) {
        this.vel.x *= -1;
        this.pos.add(new Victor((this.vel.x * dt), (this.vel.y * dt)));

        if (this.hasAccel) {
          this.initVel = this.vel.clone().norm();
        }
      }
      if (this.pos.y < this.posMin.y || this.pos.y > this.posMax.y) {
        this.vel.y *= -1;
        this.pos.add(new Victor((this.vel.x * dt), (this.vel.y * dt)));

        if (this.hasAccel) {
          this.initVel = this.vel.clone().norm();
        }
      }
    } else {
      this.inBounds();
    }
  }

  addAccel(accel, rate = null, accelLimit = null, reversal = false) {
    this.hasAccel = true;

    // positive accel = increase current direction
    // negative accel = decrease then reverse direction
    this.initVel = this.vel.clone().norm();
    this.accel = accel;
    this.accelRate = rate;
    this.accelLimit = accelLimit;
    this.accelReversal = reversal;
  }

  updateAccel() {
    // if accel has change rate update accel
    if (this.accelRate !== 0 && this.accelLimit) {
      const { accelLimit, accelReversal } = this;
      const atLimit = this.accel >= accelLimit.max || this.accel <= accelLimit.min;

      this.accel = utils.clamp(this.accel + this.accelRate, accelLimit.min, accelLimit.max);

      if (accelReversal && atLimit) {
        this.accelRate *= -1;
      }
    }

    this.vel.x += this.accel * this.initVel.x;
    this.vel.y += this.accel * this.initVel.y;
  }

  // add bullet accel
  // calls bullet's addAccel function
  addBulletAccel(accel, rate = null, accelLimit = null, reversal = false) {
    this.hasBulletAccel = true;

    // positive accel = increase current direction
    // negative accel = decrease then reverse direction
    this.bulletAccel = accel;
    this.bulletAccelRate = rate;
    this.bulletAccelLimit = accelLimit;
    this.bulletAccelReversal = reversal;
  }

  // add bullet curve (in degree)
  // calls bullet's addCurve function
  addBulletCurve(rate, limit = null, reversal = false) {
    this.hasBulletCurve = true;

    this.bulletCurveRate = rate;
    this.bulletCurveLimit = limit;
    this.bulletCurveReversal = reversal;
  }

  addBullet(rotateDeg = 0) {
    const tempVel = this.bulletVel.clone();
    tempVel.rotateDeg(rotateDeg);

    const bullet = new Bullet(this.pos, tempVel);

    // add specific bullet sprite
    if (this.bulletSprite) {
      bullet.setSprite(
        this.bulletSprite.type,
        this.bulletSprite.x,
        this.bulletSprite.y,
        this.bulletSprite.randX);
    }

    // add accel to bullet
    if (this.hasBulletAccel) {
      bullet.addAccel(
        this.bulletAccel,
        this.bulletAccelRate,
        this.bulletAccelLimit,
        this.bulletAccelReversal,
        this.bulletVelLimit);
    }

    // add curve to bullet
    if (this.hasBulletCurve) {
      bullet.addCurve(
        this.bulletCurveRate,
        this.bulletCurveLimit,
        this.bulletCurveReversal);
    }

    this.bullets.push(bullet);
  }

  update(dt) {
    this.currentRate++;

    // update rotation if hasSpin
    if (this.hasSpin) {
      this.updateSpin();
    }
    // update pos if hasVel
    if (this.hasVel) {
      // update velocity if hasAccel
      if (this.hasAccel) {
        this.updateAccel();
      }

      this.updateVel(dt);
    }

    // create bullets
    if (this.currentRate >= this.rate) {
      // create bullets based on spread values
      if (this.hasSpread) {
        const angle = this.spreadAngle / (this.shotNum - 1);

        for (let i = 0; i < this.shotNum; i++) {
          if (this.shotgun) {
            this.addBullet(utils.getRandomInt(this.spreadAngle));
          } else {
            this.addBullet(angle * i);
          }
        }
      } else {
        this.addBullet();
      }

      this.currentRate = 0;
    }
  }
}

module.exports = Emitter;
