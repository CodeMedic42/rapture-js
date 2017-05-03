const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function deferAction(getRuleCb) {
    const logicComponents = {
        onSetup: () => {
            const runningData = {};

            if (_.isFunction(getRuleCb)) {
                runningData.rule = getRuleCb();

                if (!(runningData.rule instanceof Rule)) {
                    throw new Error('Must be an an instance of Rule');
                }
            }

            return runningData;
        },
        onRun: (context, contents, params, runningData) => {
            const _runningData = runningData;

            if (_.isNil(_runningData.rule)) {
                if (_.isNil(params.rule)) {
                    throw new Error('Rule has not been defined');
                }

                _runningData.rule = params.rule;
            }

            if (_runningData.rule === params.rule || _.isNil(params.rule)) {
                // The rule has not changed so create the context if it does not exist and move on.
                if (_.isNil(_runningData.context)) {
                    _runningData.context = context.createRuleContext(_runningData.rule);

                    _runningData.context.start();
                }

                return _runningData;
            }

            // rule must have changed
            _runningData.rule = params.rule;

            // destroy the context if it has changed.
            if (!_.isNil(_runningData.context)) {
                _runningData.context.dispose().commit();

                _runningData.context = null;
            }

            _runningData.context = context.createRuleContext(_runningData.rule);

            _runningData.context.start();

            return _runningData;
        },
        onPause: (context, contents, runningData) => {
            const _runningData = runningData;

            if (!_.isNil(_runningData.context)) {
                _runningData.context.dispose().commit();

                _runningData.context = null;
            }
        },
        tearDown: (context, contents, runningData) => {
            const _runningData = runningData;

            if (!_.isNil(_runningData.context)) {
                _runningData.context.dispose().commit();

                _runningData.context = null;
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
