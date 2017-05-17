const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function deferAction(getRuleCb) {
    const logicComponents = {
        onSetup: (control) => {
            const _control = control;

            const runningData = _control.data[control.id] = {};

            if (_.isFunction(getRuleCb)) {
                runningData.rule = getRuleCb();

                if (!(runningData.rule instanceof Rule)) {
                    throw new Error('Must be an an instance of Rule');
                }
            }
        },
        onRun: (control, content, params) => {
            const runningData = control.data[control.id];

            if (_.isNil(runningData.rule)) {
                if (_.isNil(params.rule)) {
                    throw new Error('Rule has not been defined');
                }

                runningData.rule = params.rule;
            }

            if (runningData.rule === params.rule || _.isNil(params.rule)) {
                // The rule has not changed so create the context if it does not exist and move on.
                if (_.isNil(runningData.context)) {
                    runningData.context = control.createRuleContext(runningData.rule);

                    runningData.context.start();
                }

                return;
            }

            // rule must have changed
            runningData.rule = params.rule;

            // destroy the context if it has changed.
            if (!_.isNil(runningData.context)) {
                runningData.context.dispose().commit();

                runningData.context = null;
            }

            runningData.context = control.createRuleContext(runningData.rule);

            runningData.context.start();
        },
        onPause: (control) => {
            const runningData = control.data[control.id];

            if (!_.isNil(runningData.context)) {
                runningData.context.dispose().commit();

                runningData.context = null;
            }
        },
        tearDown: (control) => {
            const runningData = control.data[control.id];

            if (!_.isNil(runningData.context)) {
                runningData.context.dispose().commit();

                runningData.context = null;
            }
        }
    };

    if (getRuleCb instanceof Logic) {
        logicComponents.define = { id: 'rule', value: getRuleCb };
    } else if (!_.isFunction(getRuleCb)) {
        throw new Error('Invalid defer logic');
    }

    return Rule('defer', Logic(logicComponents));
}

module.exports = deferAction;
