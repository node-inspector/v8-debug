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
      }
    },

    caller: {
      get: function() {
        var caller = this.proto.caller;
        if (!caller) return;

        return new JavaScriptCallFrame(caller);
      }
    },

    sourceID: {
      get: function() {
        return Number(this.proto.sourceID());
      }
    },

    line: {
      get: function() {
        return Number(this.proto.line());
      }
    },

    column: {
      get: function() {
        return Number(this.proto.column());
      }
    },

    scriptName: {
      get: function() {
        return String(this.proto.scriptName());
      }
    },

    functionName: {
      get: function() {
        return String(this.proto.functionName());
      }
    },

    functionLine: {
      get: function() {
        return Number(this.proto.functionLine());
      }
    },

    functionColumn: {
      get: function() {
        return Number(this.proto.functionColumn());
      }
    },

    scopeChain: {
      get: function() {
        var scopeChain = this.proto.scopeChain();
        return scopeChain.slice();
      }
    },

    scopeType: {
      value: function(index) {
        var scopeType = this.proto.scopeType();
        return Number(scopeType[index]);
      }
    },

    thisObject: {
      get: function() {
        return this.proto.thisObject;
      }
    },

    stepInPositions: {
      get: function() {
        return String(this.proto.stepInPositions());
      }
    },

    isAtReturn: {
      get: function() {
        return Boolean(this.proto.isAtReturn);
      }
    },

    returnValue: {
      get: function() {
        return this.proto.returnValue;
      }
    }
  });

  return JavaScriptCallFrame;
});
