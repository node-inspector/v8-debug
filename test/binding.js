var expect = require('chai').expect;
var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'../package.json')));


describe('binding', function() {
  var binding = require(binding_path);
  it('source was builded and can be accessed from script', function() {
    expect(binding).to.be.instanceof(Object);
  });

  describe('core', function() {
    describe('function `call`', function() {
      it('should rethrow ReferenceError', function() {
        expect(binding.call.bind(null, function() {
          "use strict";
          if (error_here) return;
        })).to.throw(ReferenceError);
      });

      it('should rethrow SyntaxError', function() {
        expect(binding.call.bind(null, function() {
          eval('[');
        })).to.throw(SyntaxError);
      });
    });
  });
});
