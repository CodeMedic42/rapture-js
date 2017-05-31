const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function cleanUp(control) {
    const data = control.data;

    if (!_.isNil(data.context)) {
        data.context.dispose().commit();

        data.context = null;
    }
}

function onStop(control) {
    control.data.context.stop();
}

function onValid(control, content, params) {
    const data = control.data;

    if (!(params.rule instanceof Rule)) {
        throw new Error('Defer must result in a rule');
    }

    if (!_.isNil(data.rule) && data.rule === params.rule) {
        // Nothing has changed
        return;
    } else if (data.rule !== params.rule) {
        // dispose of the old context
        cleanUp(control);
    }

    data.rule = params.rule;

    data.context = control.createRuleContext(params.rule);

    data.context.start();
}

function onBuild(control) {
    const data = control.data;

    const rule = data.load();

    if (!(rule instanceof Rule)) {
        throw new Error('Defer must result in a rule');
    }

    data.context = control.createRuleContext(rule);
}

function onStart(control) {
    control.data.context.start();
}

function deferAction(load) {
    const logicComponents = {};

    if (load instanceof Logic) {
        logicComponents.define = { id: 'rule', value: load };
        logicComponents.onValid = onValid;
        logicComponents.onInvalid = cleanUp;
        logicComponents.onStop = cleanUp;
        logicComponents.onDispose = cleanUp;
    } else if (_.isFunction(load)) {
        logicComponents.options = {
            data: { load }
        };
        logicComponents.onBuild = onBuild;
        logicComponents.onStart = onStart;
        logicComponents.onStop = onStop;
        logicComponents.onDispose = cleanUp;
    } else {
        throw new Error('Invalid defer logic');
    }

    return Rule('defer', Logic('full', logicComponents));
}

module.exports = deferAction;
