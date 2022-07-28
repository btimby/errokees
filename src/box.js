class Box {
  constructor(o) {
    this.element = null;
    if (o.getBoundingClientRect) {
      this.element = o;
      o = o.getBoundingClientRect();
    }
    this.top = o.top;
    this.bottom = o.bottom;
    this.left = o.left;
    this.right = o.right;
    this.width = o.width;
    this.height = o.height;
  }

  isAbove(other, overlap=false) {
    return (
      (!overlap && this.bottom <= other.top) || 
      (overlap && this.top <= other.top)
    );
  }

  isBelow(other, overlap=false) {
    return other.isAbove(this, overlap=overlap)
  }

  isLeftOf(other, overlap=false) {
    return (
      (!overlap && this.right <= other.left) ||
      (overlap && this.left <= other.left)
    )
  }

  isRightOf(other, overlap=false) {
    return other.isLeftOf(this, overlap=overlap)
  }

  vDistance(other, from='center', to='center') {
    let tStart, oStart;

    if (from === 'center') tStart = this.top + this.height / 2;
    else if (from === 'top') tStart = this.top;
    else if (from === 'bottom') tStart = this.bottom;
    if (to === 'center') oStart = other.top + other.height / 2;
    else if (to === 'top') oStart = other.top;
    else if (to === 'bottom') oStart = other.bottom;

    return Math.abs(tStart - oStart);
  }

  hDistance(other, from='center', to='center') {
    let tStart, oStart;

    if (from === 'center') tStart = this.left + this.width / 2;
    else if (from === 'left') tStart = this.left;
    else if (from === 'right') tStart = this.right;
    if (to === 'center') oStart = other.left + other.width / 2;
    else if (to === 'left') oStart = other.left;
    else if (to === 'right') oStart = other.right;

    return Math.abs(tStart - oStart);
  }

  distance(other) {
    const tX = this.left + this.width / 2;
    const tY = this.top + this.height / 2;
    const oX = other.left + other.width / 2;
    const oY = other.top + other.height / 2;
    const X = Math.abs(tX - oX);
    const Y = Math.abs(tY - oY);
    const D = (X * X) + (Y * Y);
    return Math.floor(Math.sqrt(D));
  }

  vContains(other, overlap=false, outside=false) {
    if (!overlap) {
      return (
        ((this.left < other.left && this.left < other.right) &&
         (this.right > other.left && this.right > other.right)) ||
         (this.left === other.left && this.right === other.right) ||
         (outside && other.left < this.left && other.right > this.right)
      );
    } else {
      return (
        (this.left <= other.left && this.right >= other.left) ||
        (this.left <= other.right && this.right >= other.right) ||
        (outside && other.left < this.left && other.right > this.right)
      );
    }
  }

  hContains(other, overlap=false, outside=false) {
    if (!overlap) {
      return (
        ((this.bottom > other.bottom && this.top < other.top) &&
         (this.top < other.top && this.bottom > other.top)) ||
         (this.bottom === other.bottom && this.top === other.top) ||
         (outside && other.top < this.top && other.bottom > this.bottom)
      );
    } else {
      return (
        (this.bottom >= other.bottom && this.top <= other.top) ||
        (this.top <= other.top && this.bottom >= other.top) ||
        (outside && other.top < this.top && other.bottom > this.bottom)
      );
    }
  }
}

export default Box;
