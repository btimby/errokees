// Abstract base.
class Direction {
  constructor(name, inverse) {
    this.name = name;
    this.inverse = inverse;
  }

  compare() {
    throw new Error('Not implemented');
  }
}

class Left extends Direction {
  constructor() {
    super('left', Right);
  }

  compare(one, two) {
    const v = two.y - one.y;
    const h = two.x - one.x;
    if (h < 0) return false;
    return Math.abs(v) < Math.abs(h);
  }
}

class Right extends Direction {
  constructor() {
    super('right', Left);
  }

  compare(one, two) {
    const v = two.y - one.y;
    const h = two.x - one.x;
    if (h > 0) return false;
    return Math.abs(v) < Math.abs(h);
  }
}

class Up extends Direction {
  constructor() {
    super('up', Down);
  }

  compare(one, two) {
    const v = two.y - one.y;
    const h = two.x - one.x;
    if (v > 0) return false;
    return Math.abs(h) <= Math.abs(v);
  }
}

class Down extends Direction {
  constructor() {
    super('down', Up);
  }

  compare(one, two) {
    const v = two.y - one.y;
    const h = two.x - one.x;
    if (v < 0) return false;
    return Math.abs(h) <= Math.abs(v);
  }
}

export {
  Left, Right, Up, Down,
};
