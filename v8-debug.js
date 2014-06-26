var binding = require('./build/Release/debugger.node');

binding.call(function WRAP_debugCommandProcessor(exec_state) {
  var processor = exec_state.debugCommandProcessor(true);
  
  processor.__proto__.extendedProcessDebugJSONRequestHandles_ = {};

  processor.__proto__.extendedProcessDebugJSONRequest_ = function(json_request) {
    var request = JSON.parse(json_request);
    if (typeof this.extendedProcessDebugJSONRequestHandles_[request.command] == 'function') {
      var response = this.createResponse(request)
      this.extendedProcessDebugJSONRequestHandles_[request.command].call(this, request, response);
      return response.toJSONProtocol();
    }
  };
  
  processor.__proto__.processDebugRequest = function WRAPPED_BY_NODE_INSPECTOR(request) {
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