'use strict';

const {EventEmitter} = require('events');
const TaskActivity = require('./TaskActivity');

function SubProcess(activity) {
  Object.assign(this, activity);
}

SubProcess.prototype = Object.create(EventEmitter.prototype);

module.exports = SubProcess;

SubProcess.prototype.run = function(message) {
  this.activate().run(message);
};

SubProcess.prototype.activate = function(state) {
  const task = this;
  state = state || {};
  return TaskActivity(task, execute, state);

  function execute(activityApi, executionContext, callback) {
    const postponedExecution = executionContext.postpone((...args) => {
      state.waiting = undefined;
      callback(...args);
    });
    state.waiting = true;

    task.emit('wait', activityApi, postponedExecution);
  }
};