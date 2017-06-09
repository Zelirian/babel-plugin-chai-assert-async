# babel-plugin-chai-assert-async

Transforms `assert.async.*` calls into `test-until` expressions that resolve when the assertion passes, preserving error messages for failed assertions.

[![Build Status](https://travis-ci.org/BinaryMuse/babel-plugin-chai-assert-async.svg?branch=master)](https://travis-ci.org/BinaryMuse/babel-plugin-chai-assert-async)

## Installation

Assuming you're [already using Babel](http://babeljs.io/docs/setup/), install the Babel plugin *and the peer dependency* with your package manager of choice:

```sh
$ npm install babel-plugin-chai-assert-async test-until
```

## Usage

### Via `.babelrc`

**.babelrc**

```json
{
  "plugins": ["chai-assert-async"]
}
```

### Via CLI

```sh
$ babel --plugins chai-assert-async script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["chai-assert-async"]
});
```

## Details

During tests, it's sometime's useful to test values that are set asynchronously, or to wait for a condition to be true before continuing the test. Here's a convoluted example:

```javascript
function setValueAsync(obj) {
  setTimeout(() => obj.val = 42, 100)
}

describe('setValueAsync', function() {
  it('sets a value asynchronously', function() {
    const obj = {val: 0}
    setValueAsync(obj)
    assert.equal(obj.val, 42) // will fail
  })
})
```

This test will fail because `obj.val` does not equal `42` at the time the assertion is run.

We can use [a library like `test-until`](https://www.npmjs.com/package/test-until) to ensure the test doesn't continue until `obj.val` does equal `42`. Here's an example with Mocha, `async`/`await`

```javascript
import until from 'test-until'
// ....
it('sets a value asynchronously', function() {
  const obj = {val: 0}
  setValueAsync(obj)
  await until(() => obj.val === 42)
})
```

However, in converting from the `assert.equal` version of this test to the `await until` version, we lost some information. In particular, it's more difficult to know exactly what we're testing, and if the `until` expression times out, we get a very generic error message like "timed out waiting for something to happen" instead of something useful like "expected obj.val to equal 42".

This transform allows you to convert something like `assert.equal(obj.val, 42)` into an equivalent `until` expression by writing `assert.async.equal(obj.val, 42)`:

```javascript
function setValueAsync(obj) {
  setTimeout(() => obj.val = 42, 100)
}

describe('setValueAsync', function() {
  it('sets a value asynchronously', async function() {
    const obj = {val: 0}
    setValueAsync(obj)
    await assert.async.equal(obj.val, 42)
  })
})
```

In this case, if the async assertion fails, the original error message like "expected obj.val to equal 42" will be preserved.

If you want to pass a timeout to `test-until`, you can specify it as an argument to `async`:

```javascript
await assert.async(100).equal(obj.val, 42)
```

## Examples

**Basic**

In

```js
async function test() {
  await assert.async.equal(thing, other);
}
```

Out

```js
"use strict";

import until from 'test-until';

async function test() {
  await until(async function (fail) {
    try {
      assert.equal(thing, other);
      return true;
    } catch (err) {
      return fail(err);
    }
  });
}
```

**With explicit timeout**

In

```js
async function test() {
  await assert.async(500).equal(thing, other);
}
```

Out

```js
"use strict";

import until from 'test-until';

async function test() {
  await until(async function (fail) {
    try {
      assert.equal(thing, other);
      return true;
    } catch (err) {
      return fail(err);
    }
  }, 500);
}
```
