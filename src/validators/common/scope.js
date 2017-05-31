const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('./register.js');

function stop(control) {
    control.data.context.stop();
}

function start(control) {
    control.data.context.start();
}

function build(control) {
    const data = control.data;

    data.context = control.createRuleContextInScope(data.scopeId, data.rule);
}

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
        options: {
            data: {
                scopeId,
                rule
            }
        },
        onBuild: build,
        onStart: start,
        onStop: stop,
        onDispose: stop
    };

    return Rule('defer', Logic('full', logicComponents), {
        register: registerAction
    });
}

module.exports = scopeAction;
