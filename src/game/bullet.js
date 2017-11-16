const Victor = require('victor');
const utils = require('../utils.js');

class Bullet {
  constructor(pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, radius) {
    this.pos = new Victor(pos.x, pos.y);
    // this.prevPos = { ...this.pos };
    // this.destPos = { ...this.pos };
    this.velocity = new Victor(vel.x, vel.y);
    this.radius = radius;
    this.drained = false;
    this.active = true;
  }

  // checks if bomb should be marked to remove
  inBounds() {
    if (this.pos.x <= -50 || this.pos.x > 690 || this.pos.y <= -50 || this.pos.y > 690) {
      this.active = false;
    } else {
      this.active = true;
    }
  }

  updateAccel() {
    // if accel has change rate update accel
    if (this.accelRate && this.accelLimit) {
      const { accelLimit, accelReversal } = this;
      const atLimit = this.accel >= accelLimit.max || this.accel <= accelLimit.min;

      this.accel = utils.clamp(this.accel + this.accelRate, accelLimit.min, accelLimit.max);

      if (accelReversal && atLimit) {
        this.accelRate *= -1;
      }
    }

    this.velocity.add(this.accel);
  }

  updateCurve() {
    // if limit values exist then stop rotating when limit reached
    // else - apply constant rotation
    if (this.curveDegMax && this.curveDegMin) {
      const atLimit = this.totalCurveDeg >= this.curveDegMax ||
        this.totalCurveDeg <= this.curveDegMin;

      // if not at limit or is reversable update rotation
      if (!atLimit || this.curveReversal) {
        this.velocity.rotateByDeg(this.curveDegRate);
        this.totalCurveDeg += this.curveDegRate;
      }

      // if curve is reversable and is at limit value - invert curve rate
      if (this.curveReversal && atLimit) {
        this.curveDegRate *= -1;
      }
    } else {
      this.velocity.rotateByDeg(this.curveDegRate);
    }
  }

  // update bomb
  update(dt) {
    if (this.accel) {
      this.updateAccel();
    }

    if (this.curve) {
      this.updateCurve();
    }
    this.pos.add(new Victor(this.velocity.x * dt, this.velocity.y * dt));
    this.inBounds();
  }

  addAccel(accel, accelRate = null, accelLimit = { min: 0, max: 5 }, reversal = false) {
    this.accel = accel;

    // option controls
    this.accelRate = accelRate;
    this.accelLimit = accelLimit;
    this.accelReversal = reversal;
  }

  addCurve(rate, limit = {}, reversal = false) {
    this.totalCurveDeg = 0;
    this.curveDegRate = rate;

    // option controls
    this.curveDegMax = limit.max;
    this.curveDegMin = limit.min;
    this.curveReversal = reversal;
  }
}

module.exports = Bullet;
