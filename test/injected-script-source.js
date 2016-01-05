var expect = require('chai').expect;
var debug = require('../');
var NODE_NEXT = require('../tools/NODE_NEXT.js');

if (!NODE_NEXT) return;

describe.only('InjectedScriptSource', function() {
  before(function() {
      debug.enableWebkitProtocol();
  });

  it('isPrimitiveValue', function(done) {
    debug.registerAgentCommand('isPrimitiveValue', function(args, response, IScript, DScript) {
      expect(IScript.isPrimitiveValue(42)).to.be.equal(true);
      expect(IScript.isPrimitiveValue({})).to.be.equal(undefined);
      done();
    });

    debug.sendCommand('isPrimitiveValue');
  });

  it('wrapObject', function(done) {
    debug.registerAgentCommand('wrapObject', function(args, response, IScript, DScript) {
      expect(IScript.wrapObject.bind(IScript, {a:1}, 'console', true, false)).to.not.throw();
      expect(IScript.wrapObject.bind(IScript, {a:1}, 'console', true, true)).to.not.throw();
      expect(IScript.wrapObject.bind(IScript, 'string', 'console', true, true)).to.not.throw();
      expect(IScript.wrapObject.bind(IScript, undefined, 'console', true, true)).to.not.throw();
      expect(IScript.wrapObject.bind(IScript, {a:1}, 'console', false, false)).to.not.throw();
      expect(IScript.wrapObject.bind(IScript, {a:1}, 'console', false, true)).to.not.throw();
      done();
    });

    debug.sendCommand('wrapObject');
  });

  it('wrapTable', function(done) {
    debug.registerAgentCommand('wrapTable', function(args, response, IScript, DScript) {
      expect(IScript.wrapTable.bind(IScript, true, {a:1}, ['a'])).to.not.throw();
      done();
    });

    debug.sendCommand('wrapTable');
  });

  it('getProperties', function(done) {
    debug.registerAgentCommand('getProperties', function(args, response, IScript, DScript) {
      var objectId = IScript.wrapObject({a:1, b: Symbol('b'), get c() {}}, 'console', true, false).objectId;
      IScript.getProperties(objectId, true, true, false);
      IScript.getProperties(objectId, true, false, false);
      IScript.getProperties(objectId, false, false, false);
      IScript.getProperties(objectId, false, true, false);
      IScript.getProperties(objectId, true, false, true);

      done();
    });

    debug.sendCommand('getProperties');
  });

  it('getInternalProperties', function(done) {
    debug.registerAgentCommand('getInternalProperties', function(args, response, IScript, DScript) {
      var objectId = IScript.wrapObject({a:1, b: Symbol('b'), get c() {}}, 'console', true, false).objectId;
      IScript.getInternalProperties(objectId);

      done();
    });

    debug.sendCommand('getInternalProperties');
  });

  it('getFunctionDetails', function(done) {
    debug.registerAgentCommand('getFunctionDetails', function(args, response, IScript, DScript) {
      var c = 1;
      function d(a, b) { c = a; }
      function * g(a, b) { yield c; return c = a; }

      var functionId = IScript.wrapObject(d, 'console', true, false).objectId;
      var generatorId = IScript.wrapObject(g, 'console', true, false).objectId;
      IScript.getFunctionDetails(functionId);
      IScript.getFunctionDetails(generatorId);

      done();
    });

    debug.sendCommand('getFunctionDetails');
  });

  it('getGeneratorObjectDetails', function(done) {
    debug.registerAgentCommand('getGeneratorObjectDetails', function(args, response, IScript, DScript) {
      var c = 1;
      function * g(a, b) { yield c; return c = b; }
      var gen = g(1, 2);

      var genId = IScript.wrapObject(gen, 'console', true, false).objectId;
      IScript.getGeneratorObjectDetails(genId);

      done();
    });

    debug.sendCommand('getGeneratorObjectDetails');
  });

  it('getCollectionEntries', function(done) {
    debug.registerAgentCommand('getCollectionEntries', function(args, response, IScript, DScript) {
      var map = new Map().set('1', 1);

      var mapId = IScript.wrapObject(map, 'console', true, false).objectId;
      IScript.getCollectionEntries(mapId);

      done();
    });

    debug.sendCommand('getCollectionEntries');
  });

  it('evaluate', function(done) {
    debug.registerAgentCommand('evaluate', function(args, response, IScript, DScript) {
      IScript.evaluate('{a: 1}', 'console');
      IScript.evaluate('{a: 1}', 'console', false, true);
      IScript.evaluate('{a: 1}', 'console', false, false, true);
      IScript.evaluate('{a: 1}', 'console', true);

      done();
    });

    debug.sendCommand('evaluate');
  });

  it('callFunctionOn', function(done) {
    debug.registerAgentCommand('callFunctionOn', function(args, response, IScript, DScript) {
      var contextId = IScript.wrapObject({a: 1, b: 2}, 'console', true, false).objectId;
      var args = [
        {value: 3},
        {objectId: IScript.wrapObject({b: 4}, 'console', true, false).objectId}
      ];
      var expression = 'function(a, b) { return this.a + this.b + a + b.b; }';

      var result = IScript.callFunctionOn(contextId, expression, JSON.stringify(args)).result;
      expect(result.value).to.be.equal(10);

      done();
    });

    debug.sendCommand('callFunctionOn');
  });
});
