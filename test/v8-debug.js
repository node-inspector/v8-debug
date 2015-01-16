var expect = require('chai').expect;
var v8debug = require('../');


describe('v8-debug', function() {
  describe('runInDebugContext', function() {
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

    it('enableWebkitProtocol should enable Webkit protocol', function() {
      v8debug.enableWebkitProtocol();
      expect(v8debug.enableWebkitProtocol.bind(v8debug)).to.not.throw();
    });
  });
});
