'use strict';

const EventActivity = require('./event-activity');
const {EventEmitter} = require('events');

module.exports = function IntermediateCatchEvent(activityEvent) {
  const {id, type} = activityEvent;

  let myState = null;

  const eventApi = Object.assign(new EventEmitter(), activityEvent, {
    activate,
    getState,
    run,
  });

  return eventApi;

  function run(message) {
    return activate().run(message);
  }

  function activate(state) {
    myState = state;
    return EventActivity(eventApi, executeFn, state);
  }

  function executeFn(activityApi, executionContext, activatedEventDefinitions, callback, state) {
    if (activatedEventDefinitions.length) { 
      return activatedEventDefinitions.forEach(({execute, type}) => {
        if (type == "bpmn:TimerEventDefinition") {
          execute(myState);
        } else {
          execute(`<${id}> end`);
        }
      });
    }
    return callback();
  }

  function getState() {
    return {
      id,
      type,
    };
  }
};
