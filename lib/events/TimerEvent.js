'use strict';

const EventDefinition = require('../activities/EventDefinition');
const expressions = require('../expressions');
const iso8601duration = require('iso8601-duration');

const internals = {};

module.exports = internals.TimerEvent = function() {
  EventDefinition.apply(this, arguments);
  this.duration = this.eventDefinition.timeDuration.body;
  this._debug(`<${this.id}>`, `timeout ${this.duration}`);
};

internals.TimerEvent.prototype = Object.create(EventDefinition.prototype);

internals.TimerEvent.prototype.run = function() {
  delete this.stoppedAt;
  this.startedAt = new Date();

  this.timeout = this.hasOwnProperty('timeout') ? this.timeout : resolveDuration.call(this, this.duration);
  this._debug(`<${this.id}>`, `run for duration ${this.timeout}ms`);

  this.timer = setTimeout(() => {
    this._debug(`<${this.id}>`, 'timed out');
    delete this.timeout;
    this.complete();
  }, this.timeout);
  this.emit('start', this);
  EventDefinition.prototype.run.call(this);
};

internals.TimerEvent.prototype.discard = function() {
  this._debug(`<${this.id}>`, `cancel timeout ${this.timeout}ms`);
  clearTimeout(this.timer);
  delete this.timer;
  EventDefinition.prototype.discard.call(this);
};

internals.TimerEvent.prototype.onAttachedEnd = function(activity) {
  this._debug(`<${this.id}>`, `activity <${activity.id}> ended`);
  if (this.cancelActivity) this.discard();
};

internals.TimerEvent.prototype.resume = function(state) {
  this.startedAt = new Date(state.startedAt);
    this.timeout = state.timeout - (new Date() - this.startedAt);
    this.timeout = this.timeout > 0 ? this.timeout : 0;

    this._debug(`<${this.id}>`, `resume from ${this.timeout}ms, started at ${this.startedAt}`);

    this.entered = true;
    this.timer = setTimeout(() => {
      this._debug(`<${this.id}>`, 'timed out');
      delete this.timeout;
      this.complete();
    }, this.timeout);
};

internals.TimerEvent.prototype.deactivate = function() {
  EventDefinition.prototype.deactivate.apply(this, arguments);
  this.stoppedAt = new Date();
  if (this.timer) {
    clearTimeout(this.timer);
  }
};

internals.TimerEvent.prototype.getState = function() {
  const state = EventDefinition.prototype.getState.apply(this, arguments);
  if (!this.entered) return state;

  const stoppedAt = this.stoppedAt || new Date();

  return Object.assign(state, {
    timeout: this.timeout - (stoppedAt - this.startedAt),
    startedAt: this.startedAt,
    attachedToId: this.attachedTo && this.attachedTo.id
  });
};

function resolveDuration(duration) {
  duration = expressions(duration, this.parentContext.getFrozenVariablesAndServices());
  return iso8601duration.toSeconds(iso8601duration.parse(duration)) * 1000;
}
