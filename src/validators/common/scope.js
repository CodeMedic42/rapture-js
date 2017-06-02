const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('./register.js');
const Scope = require('../../scope.js');

function onDispose(control) {
    control.data.context.dispose().commit();
}

function onStop(control) {
    control.data.context.stop();
}

function onStart(control) {
    control.data.context.start();
}

function onBuild(control) {
    const data = control.data;

    const RuleContext = require('../../ruleContext.js'); // eslint-disable-line

    const newScope = Scope(data.scopeId, control.scope);

    data.context = RuleContext(control.contentContext, data.rule, newScope);

    control.contentContext.addRuleContext(data.context);
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
        onBuild,
        onStart,
        onStop,
        onDispose
    };

    return Rule('defer', Logic('full', logicComponents), {
        register: registerAction
    });
}

module.exports = scopeAction;
