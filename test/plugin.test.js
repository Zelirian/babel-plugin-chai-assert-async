import {assert} from 'chai';
import {transform} from 'babel-core';
import dedent from 'dedent-js';

const basic = {
  before: dedent`
    describe('stuff', function () {
      it('should work', async function () {
        await assert.async.equal(1, 2)
      })
    })
  `,

  after: dedent`
    import _until from 'test-until';
    describe('stuff', function () {
      it('should work', async function () {
        await _until(async fail => {
          try {
            assert.equal(1, 2);
            return true;
          } catch (err) {
            return fail(err);
          }
        });
      });
    });
  `,
};

const withArgs = {
  before: dedent`
    describe('stuff', function () {
      it('should work', async function () {
        await assert.async(200).equal(1, 2)
      })
    })
  `,

  after: dedent`
    import _until from 'test-until';
    describe('stuff', function () {
      it('should work', async function () {
        await _until(async fail => {
          try {
            assert.equal(1, 2);
            return true;
          } catch (err) {
            return fail(err);
          }
        }, 200);
      });
    });
  `,
};

const withoutAwait = {
  before: dedent`
    describe('stuff', function () {
      it('should work', async function () {
        assert.async.equal(1, 2)
      })
    })
  `,
};

const options = {
  "plugins": [
    "./src"
  ]
};

describe('chai-assert-async', function() {
  describe('source transform', function() {
    it('transforms basic assertions', function() {
      const before = basic.before;
      const expected = basic.after;
      const actual = transform(before, options).code;
      assert.equal(actual, expected);
    });

    it('transforms assertions with args passed to assert.async(...)', function() {
      const before = withArgs.before;
      const expected = withArgs.after;
      const actual = transform(before, options).code;
      assert.equal(actual, expected);
    });

    it('errors if the expression is not `await`ed', function() {
      const before = withoutAwait.before;
      try {
        transform(before, options).code;
        throw new Error('Should have thrown!');
      } catch (err) {
        assert.match(err.message, /assert\.async\.equal cannot be used as a statement.*did you forget to \'await\' it/);
      }
    });
  });

  describe('functionality', function() {
    it('allows for asynchronous assertions', async function() {
      let val = false;
      setTimeout(() => { val = true; });
      await assert.async.isTrue(val);
    });

    it('allows for setting the timeout', async function() {
      let val = false;
      setTimeout(() => { val = true; }, 20);
      let caught = false;
      try {
        await assert.async(10).isTrue(val);
      } catch (err) {
        caught = true;
      }

      assert.isTrue(caught);
    });

    it('retains the assertion message and adds the timeout', async function() {
      let val = false;
      setTimeout(() => { val = true; }, 20);
      let caught = null;
      try {
        await assert.async(10).isTrue(val);
      } catch (err) {
        caught = err;
      }

      assert.match(caught.message, /^async\(10ms\):/);
      assert.match(caught.message, /false.*true/);
    });
  })
});
