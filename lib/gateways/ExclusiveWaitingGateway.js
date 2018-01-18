'use strict';

const DecisionGateway = require('./decision-gateway-activity');
const { EventEmitter } = require('events');

function ExclusiveGateway(activity) {
  Object.assign(this, activity);
}

ExclusiveGateway.prototype = Object.create(EventEmitter.prototype);

module.exports = ExclusiveGateway;

ExclusiveGateway.prototype.run = function (message) {
  return this.activate().run(message);
};

ExclusiveGateway.prototype.activate = function (state) {
  const gateway = this;

  return DecisionGateway(gateway, evaluateAllOutbound, state);

  function evaluateAllOutbound(outbound, activityApi, executionContext, callback) {
    const gatewayInput = executionContext.getInputContext();
    let defaultFlow, conditionMet = false;

    if (outbound != null && outbound.length == 1) {

      outbound.forEach((flow) => {
        if (conditionMet) {
          return flow.discard();
        }
        if (flow.isDefault) {
          defaultFlow = flow;
          return;
        }

        if (flow.evaluateCondition(gatewayInput)) {
          conditionMet = true;
          flow.take();
        } else {
          flow.discard();
        }
      });

      if (defaultFlow) {
        if (conditionMet) defaultFlow.discard();
        else defaultFlow.take();
      }

      callback();

    } else {
      const postponedExecution = executionContext.postpone((...args) => {
        outbound.forEach((flow) => {
          if (conditionMet) {
            return flow.discard();
          }
          if (flow.isDefault) {
            defaultFlow = flow;
            return;
          }

          if (flow.evaluateCondition(gatewayInput)) {
            conditionMet = true;
            flow.take();
          } else {
            flow.discard();
          }
        });

        if (defaultFlow) {
          if (conditionMet) defaultFlow.discard();
          else defaultFlow.take();
        }

        state.waiting = undefined;
        callback(...args);
      });
      // state.waiting = true;

      gateway.emit('wait', activityApi, postponedExecution);
    }
  }
};
