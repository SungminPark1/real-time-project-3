const Victor = require('victor');
const utils = require('../utils.js');

class Bullet {
  constructor(pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, hasVelLimit = false, velLimit) {
    this.pos = new Victor(pos.x, pos.y);
    this.velocity = new Victor(vel.x, vel.y);
    this.hasVelLimit = hasVelLimit;
    this.velLimit = velLimit;
    this.radius = 8; // default
    this.drained = false;
    this.active = true;

    // default sprite
    this.sprite = {
      type: 16,
      x: utils.getRandomInt(16),
      y: 2,
      rotate: false,
    };
  }

  // radius is adjusted based on sprite
  setSprite(type, x, y, randX = false) {
    const sprite = {
      type,
      x,
      y,
      rotate: false,
      staticRotate: false,
      angle: 0,
    };

    // type 16 - y values 0, 1, 2, 8 set up
    // others need their hitbox adjusted
    if (type === 16) {
      if (randX) {
        sprite.x = utils.getRandomInt(16);
      }
      if (y === 0) {
        sprite.rotate = true;
        sprite.angle = Math.PI - this.velocity.verticalAngle();
        this.radius = 6;
      } else if (y === 3) {
        sprite.rotate = true;
        sprite.angle = Math.PI - this.velocity.verticalAngle();
        this.radius = 7;
      } else if (y === 4) {
        sprite.rotate = true;
        sprite.angle = Math.PI - this.velocity.verticalAngle();
        this.radius = 7;
      } else if (y === 5) {
        sprite.rotate = true;
        sprite.angle = Math.PI - this.velocity.verticalAngle();
        this.radius = 7;
      } else if (y === 6) {
        sprite.rotate = true;
        sprite.angle = Math.PI - this.velocity.verticalAngle();
        this.radius = 7;
      } else if (y === 7) {
        sprite.rotate = true;
        sprite.angle = Math.PI - this.velocity.verticalAngle();
        this.radius = 7;
      } else if (y === 8) {
        sprite.rotate = true;
        sprite.staticRotate = true;
        sprite.angle = 0;
        sprite.degree = 0;
        this.radius = 7;
      }
    } else if (type === 32) {
      if (randX) {
        sprite.x = utils.getRandomInt(8);
      }

      if (y === 1) {
        sprite.rotate = true;
        sprite.staticRotate = true;
        sprite.angle = 0;
        sprite.degree = 0;
        this.radius = 14;
      }
    } else if (type === 62) {
      if (randX) {
        sprite.x = utils.getRandomInt(4);
      }
    }

    this.sprite = sprite;
  }

  // checks if bullet should be marked to remove
  inBounds() {
    if (this.pos.x <= -50 || this.pos.x > 690 || this.pos.y <= -50 || this.pos.y > 690) {
      this.active = false;
    }
  }

  addAccel(accel, accelRate = 0, accelLimit = null, reversal = false, velLimit = null) {
    this.hasAccel = true;

    // positive accel = increase current direction
    // negative accel = decrease then reverse direction
    this.accel = accel;

    // change to unit vector (make it easier to adjust accel)
    this.initVel = this.velocity.clone().norm();

    // option controls
    this.accelRate = accelRate;
    this.accelLimit = accelLimit;
    this.accelReversal = reversal;
    this.velLimit = velLimit;
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

    this.velocity.x += this.accel * this.initVel.x;
    this.velocity.y += this.accel * this.initVel.y;
  }

  // in degree
  addCurve(rate, limit = null, reversal = false) {
    this.hasCurve = true;
    this.totalCurveDeg = 0;
    this.curveRate = rate;

    // option controls
    this.curveDegMax = limit ? limit.max : null;
    this.curveDegMin = limit ? limit.min : null;
    this.curveReversal = reversal;
  }

  updateCurve() {
    // if limit values exist then stop rotating when limit reached
    // else - apply constant rotation
    if (this.curveDegMax && this.curveDegMin) {
      const atLimit = this.totalCurveDeg >= this.curveDegMax ||
        this.totalCurveDeg <= this.curveDegMin;

      // if curve is reversable and is at limit value - invert curve rate
      if (this.curveReversal && atLimit) {
        this.curveRate *= -1;
      }
    }

    this.totalCurveDeg += this.curveRate;
    this.velocity.rotateDeg(this.curveRate);
  }

  // update bullet
  update(dt) {
    // update sprite rotation
    if (this.sprite.rotate && this.sprite.staticRotate) {
      this.sprite.degree += 3;
      this.sprite.angle = this.sprite.degree * (Math.PI / 180);
    } else if (this.sprite.rotate && !this.sprite.staticRotate && this.hasCurve) {
      this.sprite.angle = Math.PI - this.velocity.verticalAngle();
    }

    // update velocity if it exist;
    if (this.hasAccel) {
      // default to true
      let checkX = true;
      let checkY = true;

      // if velocity limit exist check velocity x and y
      if (this.hasVelLimit) {
        checkX = this.velLimit.min <= this.velocity.x && this.velLimit.max >= this.velocity.x;
        checkY = this.velLimit.min <= this.velocity.y && this.velLimit.max >= this.velocity.y;
      }

      if (checkX && checkY) {
        this.updateAccel();
      }
    }

    if (this.hasCurve) {
      this.updateCurve();
    }

    this.pos.add(new Victor((this.velocity.x * dt), (this.velocity.y * dt)));
    this.inBounds();
  }
}

module.exports = Bullet;
