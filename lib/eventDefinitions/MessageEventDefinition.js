'use strict';

const Debug = require('debug');

module.exports = function MessageEventDefinition(activityElement, eventDefinition) {
  const {id: activityId} = activityElement;
  let {id} = eventDefinition;
  if (!id) id = activityId;
  const {$type: type} = eventDefinition;

  const debug = Debug(`bpmn-engine:${type.toLowerCase()}`);

  return {
    id,
    type,
    activate,
    getState,
    resume,
  };

  function getState() {}
  function resume() {}

  function activate(parentApi, activityExecution, emit) {
    return {
      id,
      type,
      execute,
      getState,
      onStart,
      onEnter,
      onMessage,
      onEnd,
      onCancel,
      onLeave,
      onError,
      stop
    };

    function stop() {}

    function execute() {
      return onStart();
    }

    function onEnter() {
      emit('enter', parentApi, activityExecution);
    }

    function onStart() {
      emit('start', parentApi, activityExecution);
      debug(`<${id}> wait for message`);

      const callback = (...args) => {
        emit('end', parentApi, activityExecution);
      }

      const postponedExecution = activityExecution.postpone((...args) => {
        callback(...args);
      });

      emit('wait', parentApi, postponedExecution);
    }

    function onLeave() {}
    function onEnd() {}
    function onMessage() {}
    function onCancel() {}
    function onError() {}
  }
};
