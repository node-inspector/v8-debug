var expect = require('chai').expect;

var NODE_NEXT = require('../tools/NODE_NEXT');

var _debugger = require('child_process').spawn('node', ['./test/helpers/debugger.js']);

_debugger.stderr.on('data', function(data) {
  throw new Error(data);
});

describe('v8-debug', function() {
  var v8debug = null;

  before(function(done) {
    v8debug = require('../')()
    _debugger.stdout.once('data', function(data) {
      done();
    });
  });

  after(function() { v8debug = null; });

  describe('function `runInDebugContext`', function() {
    it('returns Debug object', function() {
      var Debug = v8debug.runInDebugContext('Debug');
      expect(typeof Debug).to.equal('object');
    });

    it('returns compiled function object', function() {
      var Debug = v8debug.runInDebugContext(function(){return Debug;});
      expect(typeof Debug).to.equal('object');
    });
  });

  describe('Webkit protocol', function() {
    it('if disabled, registerAgentCommand should throw error', function() {
      expect(v8debug.registerAgentCommand.bind(v8debug, 'command', [], function() {})).to.throw();
    });

    if (NODE_NEXT) {
      it('enableWebkitProtocol should enable Webkit protocol', function() {
        v8debug.enableWebkitProtocol();
        expect(v8debug.enableWebkitProtocol.bind(v8debug)).to.not.throw();
      });

      it('if enabled registerAgentCommand should register command', function(done) {
        expect(v8debug.registerAgentCommand.bind(v8debug, 'command', [], function() {
          done();
        })).to.not.throw();
        v8debug.sendCommand('command');
      });
    } else {
      it('enableWebkitProtocol should throw error', function() {
        expect(v8debug.enableWebkitProtocol).to.throw();
      });
    }
  });

  describe('events.', function() {
    it('Emits `close` on disconnect command', function(done) {
      v8debug.once('close', done);
      v8debug.sendCommand('disconnect');
    });
  });
});

if (NODE_NEXT) {
  require('./next/injected-script.js');
  require('./next/injected-script-source.js');
}
