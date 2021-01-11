'use strict';

const debug = require('debug');
const Parameter = require('../parameter');

function InputOutput(activity, parentContext) {
  this.type = activity.$type;
  this.parentContext = parentContext;
  this._debug = debug(`bpmn-engine:io:${this.type.toLowerCase()}`);
  this.activity = activity;
  initParameters.call(this);
  this.hasOutput = this.output && this.output.length;
}

InputOutput.prototype.getInput = function(message, editableContextVariables) {
  const result = {};

  if (!this.input) {
    this._debug('no input parameters, return variables and services');
    return this.parentContext.getVariablesAndServices(message, !editableContextVariables);
  }

  this._debug('get input from', message || 'variables');

  const frozenVariablesAndServices = this.parentContext && this.parentContext.getFrozenVariablesAndServices();
  this.input.forEach((parm) => {
    result[parm.name] = parm.getInputValue(message, frozenVariablesAndServices);
  });
  return result;
};

InputOutput.prototype.getOutput = function(output) {
  const result = {};
  if (!this.output) {
    return output;
  }

  const frozenVariablesAndServices = this.parentContext && this.parentContext.getFrozenVariablesAndServices();

  this._debug('get output', output);
  this.output.forEach((parm) => {
    setByKey(result, parm.name, parm.getOutputValue(output, frozenVariablesAndServices))
  });

  return result;
};

function initParameters() {
  this.input = this.activity.inputParameters && this.activity.inputParameters.map(Parameter);
  this.output = this.activity.outputParameters && this.activity.outputParameters.map(Parameter);
}


// set like lodash _.set(obj, path, value)
// https://stackoverflow.com/questions/54733539/javascript-implementation-of-lodash-set-method
function setByKey(obj, path, value) {
  if (Object(obj) !== obj) return obj; // When obj is not an object
  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []; 
  path.slice(0,-1).reduce((a, c, i) => // Iterate all of them except the last one
       Object(a[c]) === a[c] // Does the key exist and is its value an object?
           // Yes: then follow that path
           ? a[c] 
           // No: create the key. Is the next key a potential array-index?
           : a[c] = Math.abs(path[i+1])>>0 === +path[i+1] 
                 ? [] // Yes: assign a new array object
                 : {}, // No: assign a new plain object
       obj)[path[path.length-1]] = value; // Finally assign the value to the last key
  return obj; // Return the top-level object to allow chaining
};


module.exports = InputOutput;
