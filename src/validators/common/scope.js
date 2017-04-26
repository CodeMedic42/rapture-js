const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function scopeAction(...args) {
    let scopeId = null;
    let rule = null;

    if (args.length <= 0) {
        throw new Error('Must provide an instance of Rule');
    } else if (args.length === 1) {
        rule = args[0];
    } else {
        scopeId = args[0] || null;
        rule = args[1];
    }

    if (scopeId !== null && !_.isString(scopeId)) {
        throw new Error('When defined scopeID must be a string');
    }

    if (!(rule instanceof Rule)) {
        throw new Error('Must be an an instance of Rule');
    }

    const logicComponents = {
        onSetup: (context) => {
            return context.createRuleContextInScope(scopeId, rule);
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

module.exports = scopeAction;
