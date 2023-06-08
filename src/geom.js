import utils from './utils.js';

class Geom {
  constructor(el) {
    if (!el) {
      throw new Error('Invalid element');
    }
    if (!el.getBoundingClientRect) {
      utils.error(`Element ${el} has no bounding rectangle`);
      throw new Error(`Element ${el} has no bounding rectangle`);
    }
    this.rect = el.getBoundingClientRect();
    this.x = Math.round(this.rect.left + this.rect.width / 2);
    this.y = Math.round(this.rect.top + this.rect.height / 2);
    /*
    Rect attributes:
    ----------------
    - top
    - bottom
    - left
    - right
    - width
    - height
    */
  }

  directionTo(geom) {
    let x = this.x - geom.x;
    let y = this.y - geom.y;
    let dir;

    if (x > 0 && y > 0) {
      // UL quadrant
      if (y > x) dir = 'up';
      else dir = 'left';
    } else if (x <= 0 && y > 0) {
      // UR quadrant
      if (y > Math.abs(x)) dir = 'up';
      else dir = 'right';
    } else if (x > 0 && y <= 0) {
      // LL quadrant
      if (Math.abs(y) > x) dir = 'down';
      else dir = 'left';
    } else {
      // LR quadrant
      if (Math.abs(y) > Math.abs(x)) dir = 'down';
      else dir =  'right';
    }

    utils.debug(`Geom(${geom.x},${geom.y}) is`, dir, `of Geom(${this.x},${this.y})`);
    return dir;
  }

  distanceTo(geom) {
    return this.distanceTo1(geom);
  }

  distanceTo1(geom) {
    // Euclidean
    let x = this.x - geom.x;
    let y = this.y - geom.y;
    x *= x;
    y *= y;
    // NOTE: for performance, you could drop the sqrt.
    const d = Math.sqrt(x + y);
    utils.debug('distance1 =', d);
    return d;
  }

  distanceTo2(geom) {
    // Driving
    let x = Math.abs(this.x - geom.x);
    let y = Math.abs(this.y - geom.y);
    let d = x + y;
    utils.debug('distance2 =', d);
    return d;
  }
}


export default Geom;
