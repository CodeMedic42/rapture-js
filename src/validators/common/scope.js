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
        onSetup: (control) => {
            const _control = control;

            _control.data[control.id] = control.createRuleContextInScope(scopeId, rule);
        },
        onRun: (control) => {
            control.data[control.id].start();
        },
        onPause: (control) => {
            control.data[control.id].stop();
        },
        tearDown: (control) => {
            control.data[control.id].stop();
        }
    };

    return Rule('defer', Logic(logicComponents));
}

module.exports = scopeAction;
