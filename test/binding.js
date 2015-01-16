var expect = require('chai').expect;
var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'../package.json')));

describe('binding', function() {
  var binding;
  it('source was builded and can be accessed from script', function() {
    binding = require(binding_path);
    expect(binding).to.be.instanceof(Object);
  });
});