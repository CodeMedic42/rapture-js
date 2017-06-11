const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onDispose(control) {
    const data = control.data;

    if (!_.isNil(data.context)) {
        data.context.dispose().commit();

        data.context = null;
    }
}

function onStop(control) {
    control.data.context.stop();
}

function onBuild(control) {
    const data = control.data;

    const rule = data.load();

    if (!(rule instanceof Rule)) {
        throw new Error('Defer must result in a rule');
    }

    const RuleContext = require('../../ruleContext.js'); // eslint-disable-line

    data.context = RuleContext(control.contentContext, rule, control.scope);

    control.contentContext.addRuleContext(data.context);
}

function onStart(control) {
    control.data.context.start();
}

function deferAction(load) {
    const logicComponents = {
        options: {
            data: { load },
            content: {
                asToken: true
            }
        },
        onBuild,
        onStart,
        onStop,
        onDispose
    };

    if (!_.isFunction(load)) {
        throw new Error('Invalid defer logic');
    }

    return Rule('defer', Logic('full', logicComponents));
}

module.exports = deferAction;
