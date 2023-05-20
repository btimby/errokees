class Geom {
  constructor(el) {
    if (!el) {
      throw new Error('Invalid element');
    }
    if (!el.getBoundingClientRect) {
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
}

export default Geom;
