'use strict';

const testHelpers = require('../helpers/testHelpers');
const {Engine} = require('../../lib');
const {EventEmitter} = require('events');

describe('EndEvent', () => {
  describe('behaviour', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <startEvent id="start" />
        <endEvent id="end" />
        <sequenceFlow id="flow1" sourceRef="start" targetRef="end" />
      </process>
    </definitions>`;

    let context;
    beforeEach(async () => {
      context = await testHelpers.context(source);
    });

    it('has inbound', (done) => {
      const event = context.getChildActivityById('end');
      expect(event.inbound).to.have.length(1);
      done();
    });

    it('supports io', (done) => {
      const event = context.getChildActivityById('end');
      expect(event.io).to.exist;
      done();
    });

    it('emits events in expected sequence', (done) => {
      const event = context.getChildActivityById('end');
      const sequence = [];

      event.on('enter', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('enter');
      });
      event.on('start', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('start');
      });
      event.on('end', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('end');
      });
      event.on('leave', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('leave');
        expect(sequence).to.eql(['enter', 'start', 'end', 'leave']);
        done();
      });

      event.activate();
      event.inbound[0].take();
    });

    describe('getState()', () => {
      it('returns expected state on enter', (done) => {
        const event = context.getChildActivityById('end');
        event.once('enter', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'end',
            type: 'bpmn:EndEvent',
            entered: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });

      it('returns expected state on start', (done) => {
        const event = context.getChildActivityById('end');
        event.once('start', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'end',
            type: 'bpmn:EndEvent',
            entered: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });

      it('returns expected state on end', (done) => {
        const event = context.getChildActivityById('end');
        event.once('end', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'end',
            type: 'bpmn:EndEvent',
            entered: undefined,
            taken: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });

      it('returns expected state on leave', (done) => {
        const event = context.getChildActivityById('end');
        event.once('leave', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'end',
            type: 'bpmn:EndEvent',
            entered: undefined,
            taken: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });
    });
  });

  describe('TerminateEventDefinition', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <startEvent id="theStart" />
        <endEvent id="fatal">
          <terminateEventDefinition />
        </endEvent>
        <endEvent id="theEnd1" />
        <endEvent id="theEnd2" />
        <endEvent id="theEnd3" />
        <sequenceFlow id="flow1" sourceRef="theStart" targetRef="fatal" />
        <sequenceFlow id="flow2" sourceRef="theStart" targetRef="theEnd1" />
        <sequenceFlow id="flow3" sourceRef="theStart" targetRef="theEnd2" />
        <sequenceFlow id="flow4" sourceRef="theStart" targetRef="theEnd3" />
      </process>
    </definitions>`;

    let context;
    beforeEach(async () => {
      context = await testHelpers.context(source);
    });

    it('should terminate process', (done) => {
      const engine = new Engine({
        source
      });
      const listener = new EventEmitter();
      listener.once('end-theEnd1', (activityApi) => {
        expect.fail(new Error(`${activityApi.id} should have been terminated`));
      });

      engine.execute({
        listener
      });

      engine.once('end', () => {
        testHelpers.expectNoLingeringListenersOnEngine(engine);
        done();
      });
    });

    it('should have inbound sequence flows', (done) => {
      const element = context.getChildActivityById('fatal');
      expect(element).to.have.property('inbound');
      expect(element.inbound).to.have.length(1);
      done();
    });

    it.skip('and have terminate flag', (done) => {
      const element = context.getChildActivityById('fatal');
      expect(element.terminate).to.be.true();
      done();
    });

    it('emits events in expected sequence', (done) => {
      const event = context.getChildActivityById('fatal');
      const sequence = [];

      event.on('enter', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('enter');
      });
      event.on('start', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('start');
      });
      event.on('end', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('end');
      });
      event.on('leave', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('leave');
      });
      event.on('terminate', (a, b) => {
        expect(a.id).to.equal(b.id);
        sequence.push('terminate');
        expect(sequence).to.eql(['enter', 'start', 'end', 'terminate']);
        done();
      });

      event.activate();
      event.inbound[0].take();
    });

    describe('getState()', () => {
      it('returns expected state on enter', (done) => {
        const event = context.getChildActivityById('fatal');
        event.once('enter', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'fatal',
            type: 'bpmn:EndEvent',
            entered: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });

      it('returns expected state on start', (done) => {
        const event = context.getChildActivityById('fatal');
        event.once('start', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'fatal',
            type: 'bpmn:EndEvent',
            terminate: true,
            entered: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });

      it('returns expected state on end', (done) => {
        const event = context.getChildActivityById('fatal');
        event.once('end', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'fatal',
            type: 'bpmn:EndEvent',
            entered: undefined,
            terminate: true,
            taken: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });

      it('returns expected state on terminate', (done) => {
        const event = context.getChildActivityById('fatal');
        event.once('terminate', (activityApi, executionContext) => {
          const state = activityApi.getApi(executionContext).getState();
          expect(state).to.eql({
            id: 'fatal',
            type: 'bpmn:EndEvent',
            entered: undefined,
            terminate: true,
            taken: true
          });
          done();
        });

        event.activate();
        event.inbound[0].take();
      });
    });
  });
});
