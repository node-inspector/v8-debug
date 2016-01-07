"use strict";

(function (binding, DebuggerScript) {
  var lastBoundObjectId = 0;
  var idToWrappedObject = new Map();
  var idToObjectGroupName = new Map();
  var nameToObjectGroup = new Map();

  function InjectedScriptHost() {
  }

  InjectedScriptHost.prototype = binding.InjectedScriptHost;

  InjectedScriptHost.prototype.bind = function(value, groupName) {
    if (lastBoundObjectId <= 0)
        lastBoundObjectId = 1;

    var id = lastBoundObjectId++;
    idToWrappedObject.set(id, value);

    if (id < 0) return;
    if (groupName == null) return id;

    idToObjectGroupName.set(id, groupName);

    if (!nameToObjectGroup.has(groupName))
      nameToObjectGroup.set(groupName, [id]);
    else
      nameToObjectGroup.get(groupName).push(id);

    return id;
  };

  InjectedScriptHost.prototype.unbind = function(id) {
    idToWrappedObject.delete(id);
    idToObjectGroupName.delete(id);
  };

  InjectedScriptHost.prototype.releaseObject = function(objectId) {
    var parsedObjectId;
    try {
      parsedObjectId = JSON.parse(objectId);
    } catch (e) { return; }

    this.unbind(parsedObjectId.id);
  };

  InjectedScriptHost.prototype.releaseObjectGroup = function(groupName) {
    if (!groupName) return;

    var group = nameToObjectGroup.get(groupName);
    if (!group) return;

    group.forEach(function(id) {
      this.unbind(id);
    }, this);

    nameToObjectGroup.delete(groupName);
  };

  InjectedScriptHost.prototype.objectForId = function(id) {
    if (!Number(id)) return;
    return idToWrappedObject.get(id);
  };

  InjectedScriptHost.prototype.idToObjectGroupName = function(id) {
    if (!Number(id)) return;
    return idToObjectGroupName.get(id) || '';
  }

  InjectedScriptHost.prototype.isHTMLAllCollection = function(object) {
    //We don't have `all` collection in NodeJS
    return false;
  };

  InjectedScriptHost.prototype.isDOMWrapper = function(object) {
    return false;
  };

  InjectedScriptHost.prototype.suppressWarningsAndCallFunction = function(func, receiver, args) {
    return this.callFunction(func, receiver, args);
  };

  InjectedScriptHost.prototype.functionDetails = function(fun) {
    var details = this.functionDetailsWithoutScopes(fun);
    var scopes = DebuggerScript.getFunctionScopes(fun);

    if (scopes && scopes.length) {
      details.rawScopes = scopes;
    }

    return details;
  };

  InjectedScriptHost.prototype.generatorObjectDetails = function(object) {
    return DebuggerScript.getGeneratorObjectDetails(object);
  };

  InjectedScriptHost.prototype.collectionEntries = function(object) {
    return DebuggerScript.getCollectionEntries(object);
  };

  return new InjectedScriptHost();
});
