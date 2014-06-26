var binding = require('./build/Release/debug.node');
var EventEmitter = require('events').EventEmitter;

binding.call(function WRAP_debugCommandProcessor(exec_state) {
  var processor = exec_state.debugCommandProcessor(true).__proto__;
  var oldProcessDebugRequest = processor.processDebugRequest;
  
  processor.extendedProcessDebugJSONRequestHandles_ = {
    'disconnect': function(request, response) {
      processor.processDebugRequest = oldProcessDebugRequest;
      delete processor.extendedProcessDebugJSONRequest_;
      delete processor.extendedProcessDebugJSONRequestHandles_;
      
      processor.disconnectRequest_(request, response);
      
      module.exports.emit('close');
    }
  };

  processor.extendedProcessDebugJSONRequest_ = function(json_request) {
    var request = JSON.parse(json_request);
    if (typeof this.extendedProcessDebugJSONRequestHandles_[request.command] == 'function') {
      var response = this.createResponse(request)
      this.extendedProcessDebugJSONRequestHandles_[request.command].call(this, request, response);
      return response.toJSONProtocol();
    }
  };
  
  processor.processDebugRequest = function WRAPPED_BY_NODE_INSPECTOR(request) {
    return this.extendedProcessDebugJSONRequest_(request)
      || this.processDebugJSONRequest(request);
  };
});

module.exports.register = function(name, func) {
  var processor;
  binding.call(function(exec_state) {
    processor = exec_state.debugCommandProcessor(true);
    processor.__proto__.extendedProcessDebugJSONRequestHandles_[name] = func;
  });
};

module.exports.command = function(name, attributes, userdata) {
  var message = {
    seq: 1,
    type: 'request',
    command: name,
    arguments: attributes || {}
  };
  binding.signal(JSON.stringify(message));
};

module.exports.commandToEvent = function(request, response) {
  response.type = 'event';
  response.event = response.command;
  response.body = request.arguments || {};
  delete response.command;
  delete response.request_seq;
};

module.exports.__proto__ = EventEmitter.prototype;
