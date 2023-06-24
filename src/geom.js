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

  isLeft(geom) {
    /*
      \     
        \   
         +-----+
         |  g  |
    *----|  1  |
    |    +-----+
    |   /
    | /
    /
    */
    if (this.rect.left < geom.x) return false;
    let x = Math.abs(this.rect.left - geom.x);
    let y = Math.abs(geom.y - this.y) - this.rect.height / 2;
    return (x >= y);
  }

  isRight(geom) {
    if (this.rect.right > geom.x) return false;
    let x = Math.abs(this.rect.right - geom.x);
    let y = Math.abs(geom.y - this.y) - this.rect.height / 2;
    return (x >= y);
  }

  isUp(geom) {
    if (this.rect.top < geom.y) return false;
    let x = Math.abs(this.x - geom.x) - this.rect.width / 2;
    let y = Math.abs(this.rect.top - geom.y);
    return (y >= x);
  }

  isDown(geom) {
    if (this.rect.bottom > geom.y) return false;
    let x = Math.abs(this.x - geom.x) - this.rect.width / 2;
    let y = Math.abs(this.rect.bottom - geom.y);
    return (y >= x);
  }

  isInQuadrant(dir, geom) {
    switch(dir) {
      case 'left':
        return this.rect.left >= geom.x;
      case 'right':
        return this.rect.right <= geom.x;
      case 'up':
        return this.rect.top >= geom.y;
      case 'down':
        return this.rect.bottom <= geom.y;
    }
  }

  directionTo(geom) {
    let dir;

    if (this.isLeft(geom)) dir = 'left';
    else if (this.isRight(geom)) dir = 'right';
    else if (this.isUp(geom)) dir = 'up';
    else if (this.isDown(geom)) dir = 'down';
    else utils.warn('Could not determine direction');

    utils.debug(`Geom(${geom.x},${geom.y}) is`, dir, `of Geom(${this.x},${this.y})`);
    return dir;
  }

  distanceTo(geom, dir) {
    return this._distanceTo2(geom, dir);  // this.distanceTo1(geom);
  }

  _distanceTo1(geom, dir) {
    // Euclidean
    let x = this.x - geom.x;
    let y = this.y - geom.y;
    /*if (dir === 'down' || dir === 'up') {
      utils.debug('Doubling x distance');
      x *= 2;
    } else if (dir === 'left' || dir === 'right') {
      utils.debug('Doubling y distance');
      y *= 2;
    }*/
    x *= x;
    y *= y;
    // NOTE: for performance, you could drop the sqrt.
    const d = Math.sqrt(x + y);
    utils.debug('distance1 =', d);
    return d;
  }

  _distanceTo2(geom, dir) {
    // Driving
    let x = Math.abs(this.x - geom.x);
    let y = Math.abs(this.y - geom.y);
    // Accentuate distance from direction axis.
    /*if (dir === 'down' || dir === 'up') {
      utils.debug('Doubling x distance');
      x *= 2;
    } else if (dir === 'left' || dir === 'right') {
      utils.debug('Doubling y distance');
      y *= 2;
    }*/
    let d = x + y;
    utils.debug('distance2 =', d);
    return d;
  }
}

export default Geom;
