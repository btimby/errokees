import assert from 'assert';
import Box from '../src/box.js';


describe('Box', () => {
  let left, right;

  beforeEach(() => {
    left = new Box({
      top: 10,
      bottom: 20,
      left: 10,
      right: 20,
      width: 10,
      height: 10,
    });
    right = new Box({
      top: 10,
      bottom: 20,
      left: 10,
      right: 20,
      width: 10,
      height: 10,
    });
  });

  it('correctly calculates distance', () => {
    assert.strictEqual(0, left.distance(right));
    assert.strictEqual(left.distance(right), right.distance(left));
    left.top = 0;
    left.left = 0;
    right.top = 180;
    right.right = 400;
    assert.strictEqual(180, left.distance(right));
    assert.strictEqual(left.distance(right), right.distance(left));
  });

  it('correctly determines left / right', () => {
    assert.strictEqual(false, left.isLeftOf(right));
    assert.strictEqual(false, right.isRightOf(left));
    // true with overlap enabled.
    assert.strictEqual(true, left.isLeftOf(right, true));
    assert.strictEqual(true, right.isRightOf(left, true));
  });

  it('correctly determines above / below', () => {
    assert.strictEqual(false, left.isBelow(right));
    assert.strictEqual(false, right.isAbove(left));
    // true with overlap enabled.
    assert.strictEqual(true, left.isBelow(right, true));
    assert.strictEqual(true, right.isAbove(left, true));
  });

  it('correctly identifies vContains / vContains', () => {
    assert.strictEqual(true, left.hContains(right));
    assert.strictEqual(true, right.hContains(left));
    assert.strictEqual(true, left.vContains(right));
    assert.strictEqual(true, right.vContains(left));
    left.top = 12;
    left.bottom = 18;
    left.left = 12;
    left.right = 18;
    assert.strictEqual(false, left.hContains(right));
    assert.strictEqual(true, right.hContains(left));
    assert.strictEqual(false, left.vContains(right));
    assert.strictEqual(true, right.vContains(left));
    assert.strictEqual(true, left.hContains(right, true));
    assert.strictEqual(true, left.vContains(right, true));
  });

  it('correctly calculates vDistance', () => {
    assert.throws(() => {
      assert.strictEqual(20, left.vDistance(right, 'left', 'top'));
    }, 'Invalid from');
    assert.throws(() => {
      assert.strictEqual(20, left.vDistance(right, 'top', 'left'));
    }, 'Invalid to');
    left.top = 30;
    left.bottom = 40;
    assert.strictEqual(20, left.vDistance(right));
    assert.strictEqual(20, right.vDistance(left));
    assert.strictEqual(20, left.vDistance(right, 'top', 'top'));
    assert.strictEqual(20, right.vDistance(left, 'top', 'top'));
    assert.strictEqual(10, left.vDistance(right, 'top', 'bottom'));
    assert.strictEqual(30, right.vDistance(left, 'top', 'bottom'));
  });

  it('correctly calculates hDistance', () => {
    assert.throws(() => {
      assert.strictEqual(20, left.hDistance(right, 'top', 'left'));
    }, 'Invalid from');
    assert.throws(() => {
      assert.strictEqual(20, left.hDistance(right, 'left', 'top'));
    }, 'Invalid to');
    left.left = 30;
    left.right = 40;
    assert.strictEqual(20, left.hDistance(right));
    assert.strictEqual(20, right.hDistance(left));
    assert.strictEqual(20, left.hDistance(right, 'left', 'left'));
    assert.strictEqual(20, right.hDistance(left, 'left', 'left'));
    assert.strictEqual(10, left.hDistance(right, 'left', 'right'));
    assert.strictEqual(30, right.hDistance(left, 'left', 'right'));
  });
});
