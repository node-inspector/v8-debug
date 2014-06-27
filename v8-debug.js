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
    var request;  // Current request.
    var response;  // Generated response.
    try {
      try {
        // Convert the JSON string to an object.
        request = JSON.parse(json_request);
        
        if (typeof this.extendedProcessDebugJSONRequestHandles_[request.command] !== 'function') return;
        
        // Create an initial response.
        response = this.createResponse(request);
        
        if (request.arguments) {
          var args = request.arguments;
          if (args.maxStringLength !== undefined) {
            response.setOption('maxStringLength', args.maxStringLength);
          }
        }
        
        this.extendedProcessDebugJSONRequestHandles_[request.command].call(this, request, response);
      } catch (e) {
        // If there is no response object created one (without command).
        if (!response) {
          response = this.createResponse();
        }
        response.success = false;
        response.message = e.toString();
      }

      // Return the response as a JSON encoded string.
      try {
        if (response.running !== undefined) {
          // Response controls running state.
          this.running_ = response.running;
        }
        response.running = this.running_;
        return response.toJSONProtocol();
      } catch (e) {
        // Failed to generate response - return generic error.
        return '{"seq":' + response.seq + ',' +
                '"request_seq":' + request.seq + ',' +
                '"type":"response",' +
                '"success":false,' +
                '"message":"Internal error: ' + e.toString() + '"}';
      }
    } catch (e) {
      // Failed in one of the catch blocks above - most generic error.
      return '{"seq":0,"type":"response","success":false,"message":"Internal error"}';
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
