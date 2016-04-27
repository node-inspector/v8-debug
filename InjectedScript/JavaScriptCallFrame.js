"use strict";

(function(binding) {
  function JavaScriptCallFrame(proto) {
    Object.defineProperty(this, 'proto', {
      get: function() { return proto; }
    });
  }

  JavaScriptCallFrame.prototype = binding.JavaScriptCallFrame;

  Object.defineProperties(JavaScriptCallFrame.prototype, {
    setVariableValue: {
      value: function(scopeNumber, variableName, resolvedValue) {
        return this.proto.setVariableValue(scopeNumber, variableName, resolvedValue);
      },
      configurable: true
    },

    caller: {
      get: function() {
        var caller = this.proto.caller;
        if (!caller) return;

        return new JavaScriptCallFrame(caller);
      },
      configurable: true
    },

    sourceID: {
      get: function() {
        return Number(this.proto.sourceID());
      },
      configurable: true
    },

    line: {
      get: function() {
        return Number(this.proto.line());
      },
      configurable: true
    },

    column: {
      get: function() {
        return Number(this.proto.column());
      },
      configurable: true
    },

    scriptName: {
      get: function() {
        return String(this.proto.scriptName());
      },
      configurable: true
    },

    functionName: {
      get: function() {
        return String(this.proto.functionName());
      },
      configurable: true
    },

    functionLine: {
      get: function() {
        return Number(this.proto.functionLine());
      },
      configurable: true
    },

    functionColumn: {
      get: function() {
        return Number(this.proto.functionColumn());
      },
      configurable: true
    },

    scopeChain: {
      get: function() {
        var scopeChain = this.proto.scopeChain();
        return scopeChain.slice();
      },
      configurable: true
    },

    scopeType: {
      value: function(index) {
        var scopeType = this.proto.scopeType();
        return Number(scopeType[index]);
      },
      configurable: true
    },

    thisObject: {
      get: function() {
        return this.proto.thisObject;
      },
      configurable: true
    },

    stepInPositions: {
      get: function() {
        return String(this.proto.stepInPositions());
      },
      configurable: true
    },

    isAtReturn: {
      get: function() {
        return Boolean(this.proto.isAtReturn);
      },
      configurable: true
    },

    returnValue: {
      get: function() {
        return this.proto.returnValue;
      },
      configurable: true
    }
  });

  return JavaScriptCallFrame;
});
