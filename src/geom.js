class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Geom {
  constructor(el) {
    if (!el.getBoundingClientRect) {
      throw new Error('Element has no bounding rectangle');
    }
    this.element = el;
    this.rect = el.getBoundingClientRect();
    const x = this.rect.left + this.rect.width / 2;
    const y = this.rect.top + this.rect.height / 2;
    this.center = new Point(x, y);
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
}

export {
  Geom, Point,
};
