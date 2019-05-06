'use strict';

const testHelpers = require('./helpers/testHelpers');
const {Engine} = require('../');
const {EventEmitter} = require('events');

const extensions = {
  js: require('./resources/JsExtension')
};

describe('Resume task loop', () => {

  it('resumes task cardinality loop', (done) => {
    const source = `
    <definitions id="Definitions_1" xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" targetNamespace="http://bpmn.io/schema/bpmn">
      <process id="taskLoopProcess" isExecutable="true">
        <task id="recurring" name="Recurring">
          <multiInstanceLoopCharacteristics isSequential="true">
            <loopCardinality xsi:type="tFormalExpression">5</loopCardinality>
          </multiInstanceLoopCharacteristics>
        </task>
      </process>
    </definitions>`;

    const engine1 = new Engine({
      source
    });
    const listener = new EventEmitter();

    let state;
    let startCount = 0;
    listener.on('start-recurring', (activityApi) => {
      startCount += activityApi.getInput().resumed ? 0 : 1;

      if (!state && startCount === 2) {
        state = engine1.getState();
        engine1.stop();
      }
    });

    engine1.once('end', () => {
      testHelpers.expectNoLingeringListenersOnEngine(engine1);

      const engine2 = Engine.resume(testHelpers.readFromDb(state), {listener}, (err) => {
        if (err) return done(err);
      });

      engine2.once('end', () => {
        testHelpers.expectNoLingeringListenersOnEngine(engine2);

        expect(startCount).to.equal(8);
        done();
      });
    });

    engine1.execute({
      listener
    });
  });

  describe('collection expression', () => {

    it('resumes task in collection loop', (done) => {
      const source = `
      <bpmn:definitions id="Definitions_2" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:js="http://paed01.github.io/bpmn-engine/schema/2017/08/bpmn">
        <bpmn:process id="Process_1" isExecutable="true">
          <bpmn:serviceTask id="recurring" name="Each item" implementation="\${services.loop}">
            <bpmn:multiInstanceLoopCharacteristics isSequential="true" js:collection="\${variables.list}" />
          </bpmn:serviceTask>
        </bpmn:process>
      </bpmn:definitions>`;

      let sum = 0;
      testHelpers.loopFn = (executionContext, callback) => {
        sum += executionContext.item;
        callback(null, {sum});
      };

      const engine1 = new Engine({
        source,
        extensions
      });
      const listener = new EventEmitter();
      const options = {
        listener,
        variables: {
          list: [9, 8, 7, 6, 5, 4, 3, 2, 1]
        },
        services: {
          loop: {
            module: './test/helpers/testHelpers',
            type: 'require',
            fnName: 'loopFn'
          }
        }
      };

      let state;
      listener.once('end-recurring', () => {
        state = engine1.getState();
        engine1.stop();
      });

      engine1.once('end', () => {
        testHelpers.expectNoLingeringListenersOnEngine(engine1);

        const engine2 = Engine.resume(testHelpers.readFromDb(state));

        engine2.once('end', (execution, definitionExecution) => {
          expect(definitionExecution.getOutput().taskInput.recurring[3][0].sum).to.equal(13);
          done();
        });

      });

      engine1.execute(options);
    });
  });
});
