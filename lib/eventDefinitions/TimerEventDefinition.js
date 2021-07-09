'use strict';

const Debug = require('debug');
const { toSeconds, parse } = require('iso8601-duration');

module.exports = function TimerEventDefinition(activityElement, eventDefinition) {
  const { id: activityId } = activityElement;
  let { id } = eventDefinition;
  if (!id) id = activityId;
  const { $type: type, timeDuration } = eventDefinition;
  const durationDeclaration = timeDuration && timeDuration.body;

  const debug = Debug(`bpmn-engine:${type.toLowerCase()}`);
  debug(`<${id}> loaded`);

  let myState = null;


  return {
    id,
    type,
    duration: durationDeclaration,
    activate,
    resume: resumeActivity
  };

  function resumeActivity(state, parentApi, activityExecution, emit) {
    const resumed = activate(parentApi, activityExecution, emit);
    resumed.resume(state);
    return resumed;
  }

  function activate(parentApi, activityExecution, emit) {
    const isoDuration = activityExecution.resolveExpression(durationDeclaration);
    let completeState, duration, startedAt, stoppedAt, timer;
    let timeout = duration = isoToMs(isoDuration);

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
      resume,
      stop
    };

    function getState() {
      if (completeState) return completeState;

      const remaining = getRemainingMs();
      const result = {
        timeout: remaining,
        duration,
      };

      if (startedAt) {
        result.startedAt = startedAt;
      } else {
        result.startedAt = new Date();
        startedAt = result.startedAt;
      }

      if (stoppedAt) {
        result.stoppedAt = stoppedAt;
      }

      return result;
    }

    function resume(state) {
      myState = state;

      duration = state.duration;
      timeout = state.timeout;
      startedAt = state.startedAt;
    }

    function stop() {
      if (timer) {
        debug(`<${id}> stop timer`);
        clearTimeout(timer);
      }
      timer = null;
    }

    function execute(myStateParam) {
      if (myState == null) {
        myState = {};
        myState.startedAt = parentApi.getState().startedAt;
      }
      if (myStateParam != null && myStateParam.startedAt != null) {
        myState.startedAt = myStateParam.startedAt;
      } else {
        myState.startedAt = new Date();
      }
      onStart();
    }

    function onEnter() { }

    function onStart() {
      startedAt = new Date();
      if (myState != null && myState.startedAt != null) {
        startedAt = new Date(myState.startedAt);
      }

      let passedTime = new Date().getTime() - startedAt.getTime();
      if (passedTime > duration) {
        // execute
        complete();

      } else {
        let continueTime = duration - passedTime;
        if (continueTime > 0) {
          // Fix for contiune Timer > 20 days -> engine stops within few seconds
          if (continueTime < (1000 * 60 * 60 * 24 * 2)) {
            timer = setTimeout(complete, continueTime);
          }
        } else {
          complete();
        }
      }

      debug(`<${id}> initiate for duration ${isoDuration}`);

      emit('start', parentApi, activityExecution);
      emit('wait', parentApi, activityExecution);
    }

    function onLeave() { }
    function onEnd() { }
    function onMessage() { }
    function onCancel() { }
    function onError() {
      stop();
    }

    function getRemainingMs() {
      if (!startedAt) return timeout;
      const now = stoppedAt || new Date();

      const runningTime = now.getTime() - startedAt.getTime();
      return timeout - runningTime;
    }

    function complete() {
      timer = null;
      stoppedAt = new Date();
      debug(`<${id}> timed out`);
      completeState = getState();
      completeState.timeout = undefined;
      completeState.startedAt = undefined;

      emit('end', parentApi, activityExecution);
    }
  }

  function isoToMs(isoDuration) {
    return toSeconds(parse(isoDuration)) * 1000;
  }
};
