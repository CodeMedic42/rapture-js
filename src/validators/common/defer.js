// const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function customAction(getRuleCb) {
    const logicComponents = {
        onSetup: (context, contents) => {
            const rule = getRuleCb();

            if (!(rule instanceof Rule)) {
                throw new Error('Must be an an instance of Rule');
            }

            return context.createRuleContext(rule, contents);
        },
        onRun: (context, contents, params, logicValue) => {
            logicValue.start();
        },
        onPause: (context, contents, logicValue) => {
            logicValue.stop();
        },
        tearDown: (context, contents, logicValue) => {
            logicValue.stop();
        }
    };

    return Rule('defer', Logic(logicComponents));
}

module.exports = customAction;
