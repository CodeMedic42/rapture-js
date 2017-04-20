const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function start(currentValue) {
    if (!_.isNil(currentValue.nextContext)) {
        currentValue.nextContext.stop();
    }

    currentValue.thenContext.start();
}

function onRun(context, contents, params, currentValue) {
    const isCondition = currentValue.isCondition;

    if (isCondition === 'string' && _.isString(contents)) {
        start(currentValue);
    } else if (isCondition === 'number' && _.isFinite(contents)) {
        start(currentValue);
    } else if (isCondition === 'boolean' && _.isBoolean(contents)) {
        start(currentValue);
    } else if (isCondition === 'date' && Common.isDate(contents)) {
        start(currentValue);
    } else if (isCondition === 'object' && _.isPlainObject(contents)) {
        start(currentValue);
    } else if (isCondition === 'array' && _.isArray(contents)) {
        start(currentValue);
    } else if (_.isNil(isCondition)) {
        start(currentValue);
    } else {
        currentValue.thenContext.stop();

        if (!_.isNil(currentValue.nextContext)) {
            currentValue.nextContext.start();
        }
    }

    return currentValue;
}

function onPause(control, contents, currentValue) {
    if (!_.isNil(currentValue.nextContext)) {
        currentValue.nextContext.stop();
    }

    currentValue.thenContext.stop();
}

function isLogic(isCondition, thenRule, actions, nextIs) {
    const logicDef = _.isNil(nextIs) ? null : Logic(nextIs);

    return {
        onSetup: (control) => {
            return {
                isCondition,
                thenContext: control.createRuleContext(thenRule),
                nextContext: !_.isNil(logicDef) ? control.buildLogicContext(logicDef) : null
            };
        },
        onRun,
        onPause
    };
}

function validationIsCondition(condition) {
    if (condition !== 'string' &&
        condition !== 'number' &&
        condition !== 'boolean' &&
        condition !== 'date' &&
        condition !== 'object' &&
        condition !== 'array') {
        throw new Error('Must provide a valid string');
    }
}

function validateRule(rule) {
    if (!(rule instanceof Rule)) {
        throw new Error('Must provide a rule');
    }
}

function isAction(isCondition, thenRule) {
    validationIsCondition(isCondition);
    validateRule(thenRule);

    const logicList = [];

    logicList.unshift(isLogic.bind(null, isCondition, thenRule));

    const isActions = {
        elseIs: (childIsCondition, childRule) => {
            validationIsCondition(childIsCondition);
            validateRule(childRule);

            logicList.unshift(isLogic.bind(null, childIsCondition, childRule));

            return isActions;
        },
        else: (childRule) => {
            validateRule(childRule);

            logicList.unshift(isLogic.bind(null, null, childRule));

            return isActions.endIf();
        },
        endIs: () => {
            const finalLogic = _.reduce(logicList, (nextIs, logicFunc) => {
                return logicFunc(nextIs);
            }, null);

            const logic = Logic(finalLogic);

            return Rule('is', logic);
        }
    };

    return isActions;
}

module.exports = isAction;
