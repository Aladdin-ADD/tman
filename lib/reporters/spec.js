'use strict'
// **Github:** https://github.com/thunks/tman
//
// **License:** MIT

var util = require('util')
var format = require('../format')
var Reporter = require('./base')

module.exports = Spec
Reporter.defaultReporter = Spec

function Spec (ctx) {
  Reporter.call(this, ctx)
}

util.inherits(Spec, Reporter)

Spec.prototype.onSuiteStart = function (suite) {
  if (this.ctx === suite.ctx) return // It is rootSuite
  var title = '✢ ' + suite.title
  title = format[suite.mode === 'skip' ? 'cyan' : 'white'](title, true)
  this.log(format.indent(suite.depth) + title)
}

Spec.prototype.onSuiteFinish = function (suite) {
  if (suite.state instanceof Error) {
    var title = format.red('✗ ' + suite.state.title + ' (' + suite.state.order + ')', true)
    this.log(format.indent(suite.depth + 1) + title)
  }
}

Spec.prototype.onTestFinish = function (test) {
  var title = test.title
  if (test.state === null) {
    title = format.cyan('‒ ' + title, true)
  } else if (test.state === true) {
    title = format.green('✓ ') + format.gray(title)
    var time = test.endTime - test.startTime
    if (time > 50) title += format.red(' (' + time + 'ms)')
  } else {
    title = format.red('✗ ' + title + ' (' + test.state.order + ')', true)
  }
  this.log(format.indent(test.depth) + title)
}

Spec.prototype.onFinish = function (rootSuite) {
  var ctx = this
  var message = ''

  if (rootSuite.abort) message += format.yellow('\nTest is terminated by SIGINT!\n', true)
  message += format.reset('\nTest ' + (rootSuite.errors.length ? 'failed: ' : 'finished: '))
  message += format[rootSuite.passed ? 'green' : 'gray'](rootSuite.passed + ' passed; ', true)
  message += format[rootSuite.errors.length ? 'red' : 'gray'](rootSuite.errors.length + ' failed; ', true)
  message += format[rootSuite.ignored ? 'cyan' : 'gray'](rootSuite.ignored + ' ignored.', true)
  message += format.yellow(' (' + (rootSuite.endTime - rootSuite.startTime) + 'ms)', true)
  ctx.log(message, format.reset('\n'))

  rootSuite.errors.forEach(function (err) {
    ctx.log(format.indent(1) + format.red(err.order + ') ' + err.title + ':', true))
    var message = err.stack ? err.stack : String(err)
    ctx.log(message.replace(/^/gm, format.indent(2)))
  })
  if (rootSuite.errors.length) ctx.log(format.reset('\n'))
  if (rootSuite.exit) process.exit((rootSuite.errors.length || !rootSuite.passed) ? 1 : 0)
}

// Result:
// ```
//
//   ✢ suite level 1-1
//     ✓ test level 2-1
//     ✓ test level 2-2
//     ✢ suite level 2-1
//       ✓ test level 3-1 (106ms)
//       ✓ test level 3-2
//     ✢ suite level 2-2
//       ✓ test level 3-1 (105ms)
//       ✓ test level 3-2
//       ✢ suite level 3-1
//         ‒ test level 4-1
//         ‒ test level 4-2
//       ✢ suite level 3-2
//         ✓ test level 4-1 (100ms)
//         ✓ test level 4-2
//         ‒ test level 4-3
//         ✓ test level 4-4
//   ✓ test level 1-1 (100ms)
//   ✗ test level 1-2 (1)
//   ✓ test level 1-3
//
// Test failed: 11 passed; 1 failed; 3 ignored. (606ms)
//
//   1) /test level 1-2:
//     AssertionError: 22 === 21
//         at Test.fn (/Users/zensh/git/js/thunkjs/tman/example/nested.js:116:10)
//         at Test.<anonymous> (/Users/zensh/git/js/thunkjs/tman/lib/core.js:557:37)
//
// ```
