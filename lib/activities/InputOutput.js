'use strict';

const debug = require('debug');
const _ = require('lodash');
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
  const variablesClone = _.cloneDeep(frozenVariablesAndServices.variables);
  
  this._debug('get output', output);
  this.output.forEach((parm) => {
    // allow use current variables in path name of new variables
    setByKey(result, parm.name, parm.getOutputValue(output, frozenVariablesAndServices), variablesClone)
  });

  return result;
};

function initParameters() {
  this.input = this.activity.inputParameters && this.activity.inputParameters.map(Parameter);
  this.output = this.activity.outputParameters && this.activity.outputParameters.map(Parameter);
}


// set like lodash _.set(obj, path, value)
// https://stackoverflow.com/questions/54733539/javascript-implementation-of-lodash-set-method
// rewrited to put variables in []
function setByKey(obj, path, value, variables) {
  if (Object(obj) !== obj) return obj; // When obj is not an object
  // If not yet an array, get the keys from the string-path
  
  // update: use variables in []: split only by . (ex: data.list[r[0]].title => data.list, [r[0]], title)
  const findReg = /\[[^\[\]]*\]/g;
  do {
    path = path.replace(findReg, val => {
      val = val.trim();
      const varValue = getByKey(variables, val);
      val = varValue !== undefined
        ? varValue
        : val.substr(1, val.length-2);
      return "." + val;
    })
  } while (path.match(findReg) )

  // split path
  path = path.toString().match(/[^.[\]]+/g) || [];

  // get curent root key value from variables
  path.slice(0,-1).reduce((a, c, i) => // Iterate all of them except the last one
       Object(a[c]) === a[c] // Does the key exist and is its value an object?
           // Yes: then follow that path
           ? a[c] 
           // No: create the key. Is the next key a potential array-index?
           : a[c] = Math.abs(path[i+1])>>0 === +path[i+1] 
                 ? [] // Yes: assign a new array object
                 : {}, // No: assign a new plain object
                 variables)[path[path.length-1]] = value; // Finally assign the value to the last key
  
  // set root key
  const rootKey = path[0];
  obj[rootKey] = variables[ rootKey ];

  return obj; // Return the top-level object to allow chaining
};

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get
function getByKey(obj, path, defaultValue = undefined) {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

/*
// merge deep 2 objects or arrys
// https://stackoverflow.com/a/48218209
// full rewrite to merge arrays with override items by index
function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    if ( isObject(prev) && isObject(obj) ) {
      Object.keys(obj).forEach(key => {
        // update: prev may not be object
        const pVal = prev[key];
        const oVal = obj[key];
        prev[key] = mergeDeep(pVal, oVal);
      });
      return prev;

    } else if (Array.isArray(prev) && Array.isArray(obj) ) {
      obj.forEach( (value, index) => {
        prev[index] = mergeDeep(prev[index], value);
      });
      return prev;
    
    } else {
      return obj;
    }
    
  }, null);
}
*/

module.exports = InputOutput;
