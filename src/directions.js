// Abstract base.
const INVERSE_NAMES = {
  'left': 'right',
  'right': 'left',
  'up': 'down',
  'down': 'up',
};


class _Direction {
  constructor(name) {
    this.name = name;
    this.inverse = INVERSE_NAMES[name];
  }

  compare() {
    throw new Error('Not implemented');
  }
}

class _Left extends _Direction {
  constructor() {
    super('left');
  }

  compare(one, two) {
    // Return true if two is left of one.
    const x = Math.abs(two.x - one.x);
    const y = Math.abs(two.y - one.y);

    if (x > 0) return false;
    return y < x;
  }
}

class _Right extends _Direction {
  constructor() {
    super('right');
  }

  compare(one, two) {
    // Return true if two is right of one.
    const x = Math.abs(two.x - one.x);
    const y = Math.abs(two.y - one.y);

    if (x < 0) return false;
    return y < x;
  }
}

class _Up extends _Direction {
  constructor() {
    super('up');
  }

  compare(one, two) {
    // Return true if two is above me.
    const x = Math.abs(two.x - one.x);
    const y = Math.abs(two.y - one.y);

    if (y > 0) return false;
    return x <= y;
  }
}

class _Down extends _Direction {
  constructor() {
    super('down');
  }

  compare(one, two) {
    // Return true if two is below me.
    const x = Math.abs(two.x - one.x);
    const y = Math.abs(two.y - one.y);

    if (y < 0) return false;
    return x <= y;
  }
}

const Left = new _Left();
const Right = new _Right();
const Up = new _Up();
const Down = new _Down();

const ALL = [Left, Right, Up, Down];

export {
  Left, Right, Up, Down, ALL, INVERSE_NAMES,
};
