[![Build Status](https://secure.travis-ci.org/node-inspector/v8-debug.png?branch=master)](http://travis-ci.org/node-inspector/v8-debug)

v8-debug provides extending API for [node](http://github.com/ry/node) internal debugger protocol (based ob v8 debugger protocol)
This is a part of [node-inspector](http://github.com/node-inspector/node-inspector)

## Installation

    npm install v8-debug

## Usage

    var debug = require('v8-debug');

## API

    debug.register('console', function(request, response) { //register 'console' command in v8 debugger protocol
	  response.type = 'event'; //by default type == 'command'
	  response.event = 'console';
	  delete response.request_seq; //for event this propertie is not useful
	  delete response.command;
      response.body = {
	    message: 'console was called'
      };
	});

	console.log = (function(fn) {
	  return function() {
	    debug.signal('console', arguments); //Call 'console' command and pass arguments as data
	    return fn.apply(console, arguments);
	  }
	} (console.log));
