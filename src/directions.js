// Abstract base.
class _Direction {
  constructor(name, inverse) {
    this.name = name;
    this.inverse = inverse;
  }

  compare() {
    throw new Error('Not implemented');
  }
}

class _Left extends _Direction {
  constructor() {
    super('left', 'right');
  }

  compare(one, two) {
    // Return true if two is left of one.
    const v = two.y - one.y;
    const h = two.x - one.x;

    if (h > 0) return false;
    return Math.abs(v) < Math.abs(h);
  }
}

class _Right extends _Direction {
  constructor() {
    super('right', 'left');
  }

  compare(one, two) {
    // Return true if two is right of one.
    const v = two.y - one.y;
    const h = two.x - one.x;

    if (h < 0) return false;
    return Math.abs(v) < Math.abs(h);
  }
}

class _Up extends _Direction {
  constructor() {
    super('up', 'down');
  }

  compare(one, two) {
    const v = two.y - one.y;
    const h = two.x - one.x;

    if (v > 0) return false;
    return Math.abs(h) <= Math.abs(v);
  }
}

class _Down extends _Direction {
  constructor() {
    super('down', 'up');
  }

  compare(one, two) {
    const v = two.y - one.y;
    const h = two.x - one.x;

    if (v < 0) return false;
    return Math.abs(h) <= Math.abs(v);
  }
}

const Left = new _Left();
const Right = new _Right();
const Up = new _Up();
const Down = new _Down();

const ALL = [Left, Right, Up, Down];

export {
  Left, Right, Up, Down, ALL,
};
