//var binary = require('node-pre-gyp');
var fs = require('fs');
var path = require('path');
var pack = require('./package.json');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var extend = require('util')._extend;

var binding = require('./' + [
  'build',
  'debug',
  'v' + pack.version,
  ['node', 'v' + process.versions.modules, process.platform, process.arch].join('-'),
  'debug.node'
].join('/'));

var NODE_NEXT = require('./tools/NODE_NEXT');
var nextTmpEventId = 1;

function InjectedScriptDir(link) {
  return require.resolve(__dirname + '/InjectedScript/' + link);
};
var DebuggerScriptLink = InjectedScriptDir('DebuggerScript.js');
var InjectedScriptLink = InjectedScriptDir('InjectedScriptSource.js');
var InjectedScriptHostLink = InjectedScriptDir('InjectedScriptHost.js');
var JavaScriptCallFrameLink = InjectedScriptDir('JavaScriptCallFrame.js');

var overrides = {
  extendedProcessDebugJSONRequestHandles_: {},
  extendedProcessDebugJSONRequestAsyncHandles_: {},
  extendedProcessDebugJSONRequest_: function(json_request) {
    var request;  // Current request.
    var response;  // Generated response.
    try {
      try {
        // Convert the JSON string to an object.
        request = JSON.parse(json_request);

        var handle = this.extendedProcessDebugJSONRequestHandles_[request.command];
        var asyncHandle = this.extendedProcessDebugJSONRequestAsyncHandles_[request.command];
        var asyncResponse;

        if (!handle && !asyncHandle) return;

        // Create an initial response.
        response = this.createResponse(request);

        if (request.arguments) {
          var args = request.arguments;
          if (args.maxStringLength !== undefined) {
            response.setOption('maxStringLength', args.maxStringLength);
          }
          if (args.asyncResponse) {
            asyncResponse = args.asyncResponse;
          }
        }

        if (asyncHandle) {
          if (asyncResponse) return JSON.stringify(asyncResponse);

          asyncHandle.call(this, request, response, function(error) {
            sendCommand(request.command, {
              asyncResponse: error || response
            });
          }.bind(this));

          return '{"seq":0,"type":"response","success":true}';
        }

        handle.call(this, request, response);
      } catch (e) {
        // If there is no response object created one (without command).
        if (!response) {
          response = this.createResponse();
        }
        response.success = false;
        response.message = e.stack;
      }

      // Return the response as a JSON encoded string.
      try {
        if (response.running !== undefined) {
          // Response controls running state.
          this.running_ = response.running;
        }
        response.running = this.running_;
        return JSON.stringify(response);
      } catch (e) {
        // Failed to generate response - return generic error.
        return '{"seq":' + response.seq + ',' +
                '"request_seq":' + request.seq + ',' +
                '"type":"response",' +
                '"success":false,' +
                '"message":"Internal error: ' + e.stack + '"}';
      }
    } catch (e) {
      // Failed in one of the catch blocks above - most generic error.
      return '{"seq":0,"type":"response","success":false,"message":"' + e.stack + '"}';
    }
  },
  processDebugRequest: function WRAPPED_BY_NODE_INSPECTOR(request) {
    return (this.extendedProcessDebugJSONRequest_
      && this.extendedProcessDebugJSONRequest_(request))
      || this.processDebugJSONRequest(request);
  }
};

inherits(V8Debug, EventEmitter);
function V8Debug() {
  if (!(this instanceof V8Debug)) return new V8Debug();

  this._Debug = this.get('Debug');

  this._webkitProtocolEnabled = false;

  // NOTE: Call `_setDebugEventListener` before all other changes in Debug Context.
  // After node 0.12.0 this function serves to allocate Debug Context
  // like a persistent value, that saves all our changes.
  this._setDebugEventListener();
  // We need to share security token between current and debug context to
  // get access to evaluation functions
  this._shareSecurityToken();
  this._wrapDebugCommandProcessor();

  this.once('close', function() {
    this._disableWebkitProtocol();
    this._unwrapDebugCommandProcessor();
    this._unshareSecurityToken();
    this._unsetDebugEventListener();
  });
}

V8Debug.prototype._setDebugEventListener = function() {
  this._Debug.setListener(function(_, execState, event) {
    // TODO(3y3): Handle events here
  });
};

V8Debug.prototype._unsetDebugEventListener = function() {
  this._Debug.setListener(null);
};

V8Debug.prototype._shareSecurityToken = function() {
  binding.shareSecurityToken();
};

V8Debug.prototype._unshareSecurityToken = function() {
  binding.unshareSecurityToken();
};

V8Debug.prototype._wrapDebugCommandProcessor = function() {
  var proto = this.get('DebugCommandProcessor.prototype');
  this._DebugCommandProcessor = proto;

  if (!proto.processDebugRequest_) {
    proto.processDebugRequest_ = proto.processDebugRequest;
    extend(proto, overrides);
  }

  proto.extendedProcessDebugJSONRequestHandles_['disconnect'] = function(request, response) {
    this.emit('close');
    proto._DebugCommandProcessor;
    //proto.processDebugJSONRequest(request, response);
    //return true;
  }.bind(this);
};

V8Debug.prototype._unwrapDebugCommandProcessor = function() {
  var proto = this.get('DebugCommandProcessor.prototype');
  delete this._DebugCommandProcessor;

  proto.extendedProcessDebugJSONRequestHandles_ = {};
  proto.extendedProcessDebugJSONRequestAsyncHandles_ = {};
};

V8Debug.prototype.setPauseOnNextStatement = function(pause) {
  binding.setPauseOnNextStatement(pause === true);
};

V8Debug.prototype.setLiveEditEnabled = function(enabled) {
  binding.setLiveEditEnabled(enabled === true);
};

V8Debug.prototype.scripts = function() {
  return this._Debug.scripts();
};

V8Debug.prototype.register =
V8Debug.prototype.registerCommand = function(name, func) {
  var proto = this._DebugCommandProcessor;
  if (!proto) return;

  proto.extendedProcessDebugJSONRequestHandles_[name] = func;
};

V8Debug.prototype.unregister =
V8Debug.prototype.unregisterCommand = function(name, func) {
  var proto = this._DebugCommandProcessor;
  if (!proto) return;

  delete proto.extendedProcessDebugJSONRequestHandles_[name];
};

V8Debug.prototype.registerAsync =
V8Debug.prototype.registerAsyncCommand = function(name, func) {
  var proto = this._DebugCommandProcessor;
  if (!proto) return;

  proto.extendedProcessDebugJSONRequestAsyncHandles_[name] = func;
};

V8Debug.prototype.command =
V8Debug.prototype.sendCommand = sendCommand;
function sendCommand(name, attributes, userdata) {
  var message = {
    seq: 0,
    type: 'request',
    command: name,
    arguments: attributes
  };
  binding.sendCommand(JSON.stringify(message));
};

V8Debug.prototype.emitEvent = emitEvent;
function emitEvent(name, attributes, userdata) {
  var handlerName = 'tmpEvent-' + nextTmpEventId++;
  this.registerCommand(handlerName, function(request, response) {
    this.commandToEvent(request, response);
    response.event = name;
    this.unregisterCommand(handlerName);
  }.bind(this));
  this.sendCommand(handlerName, attributes, userdata);
}

V8Debug.prototype.commandToEvent = function(request, response) {
  response.type = 'event';
  response.event = response.command;
  response.body = request.arguments || {};
  delete response.command;
  delete response.request_seq;
};

V8Debug.prototype.get =
V8Debug.prototype.runInDebugContext = function(script) {
  if (typeof script == 'function') script = '(' + script.toString() + ')()';

  return binding.runScript(script);
};

V8Debug.prototype.getFromFrame = function(index, value) {
  var result;

  binding.call(function(execState) {
    var _index = index + 1;
    var _count = execState.frameCount();
    if (_count > _index + 1 ) {
      var frame = execState.frame(_index + 1);
      _count = frame.scopeCount();
      _index = 0;
      while (_count --> 0) {
        var scope = frame.scope(_index).scopeObject().value();
        if (scope[value]) {
          result = scope[value];
          return;
        }
      }
    }
  });

  return result;
};

V8Debug.prototype.enableWebkitProtocol = function() {
  if (!NODE_NEXT) {
    throw new Error('WebKit protocol is not supported on target node version (' + process.version + ')');
  }

  if (this._webkitProtocolEnabled) return;

  var DebuggerScriptSource,
      DebuggerScript,
      InjectedScriptSource,
      InjectedScript,
      InjectedScriptHostSource,
      InjectedScriptHost;

  this.runInDebugContext('ToggleMirrorCache = ToggleMirrorCache || function() {}');

  DebuggerScriptSource = fs.readFileSync(DebuggerScriptLink, 'utf8');
  DebuggerScript = this.runInDebugContext(DebuggerScriptSource);

  InjectedScriptSource = fs.readFileSync(InjectedScriptLink, 'utf8');
  InjectedScript = this.runInDebugContext(InjectedScriptSource);

  InjectedScriptHostSource = fs.readFileSync(InjectedScriptHostLink, 'utf8');
  InjectedScriptHost = this.runInDebugContext(InjectedScriptHostSource)(binding, DebuggerScript);

  JavaScriptCallFrameSource = fs.readFileSync(JavaScriptCallFrameLink, 'utf8');
  JavaScriptCallFrame = this.runInDebugContext(JavaScriptCallFrameSource)(binding);

  var injectedScript = InjectedScript(InjectedScriptHost, global, process.pid);

  this.registerAgentCommand = function(command, parameters, callback) {
    if (typeof parameters === 'function') {
      callback = parameters;
      parameters = [];
    }

    this.registerCommand(command, new WebkitCommandCallback(parameters, callback));
  };

  this.emitAgentEvent = function(command, callback) {
    var handlerName = 'tmpEvent-' + nextTmpEventId++;
    this.registerCommand(handlerName, function(request, response) {
      this.commandToEvent(request, response);
      response.event = command;

      new WebkitEventCallback(callback)(request, response);
      this.unregisterCommand(handlerName);
    }.bind(this));
    this.sendCommand(handlerName);
  };

  this.wrapCallFrames = function(execState, maximumLimit, scopeDetails) {
    var scopeBits = 2;

    if (maximumLimit < 0) throw new Error('Incorrect stack trace limit.');
    var data = (maximumLimit << scopeBits) | scopeDetails;
    var currentCallFrame = DebuggerScript.currentCallFrame(execState, data);
    if (!currentCallFrame) return;

    return new JavaScriptCallFrame(currentCallFrame);
  };

  this.releaseObject = function(name) {
    return InjectedScriptHost.releaseObject(name);
  };

  this.releaseObjectGroup = function(name) {
    return InjectedScriptHost.releaseObjectGroup(name);
  };

  this._webkitProtocolEnabled = true;

  function WebkitCommandCallback(argsList, callback) {
    return function(request, response) {
      InjectedScriptHost.execState = this.exec_state_;

      var args = argsList.map(function(name) {
        return request.arguments[name];
      });

      callback.call(this, args, response, injectedScript, DebuggerScript);

      InjectedScriptHost.execState = null;
    }
  }

  function WebkitEventCallback(callback) {
    return function(request, response) {
      InjectedScriptHost.execState = this.exec_state_;

      callback.call(this, response, injectedScript, DebuggerScript);

      InjectedScriptHost.execState = null;
    }
  }
};

V8Debug.prototype._disableWebkitProtocol = function() {
  if (!this._webkitProtocolEnabled) return;
  this._webkitProtocolEnabled = false;
  this.runInDebugContext('ToggleMirrorCache(true)');
};

V8Debug.prototype.releaseObject =
V8Debug.prototype.releaseObjectGroup =
V8Debug.prototype.wrapCallFrames =
V8Debug.prototype.registerAgentCommand = function(command, parameters, callback) {
  throw new Error('Use "enableWebkitProtocol" before using this method');
};

module.exports = V8Debug;
