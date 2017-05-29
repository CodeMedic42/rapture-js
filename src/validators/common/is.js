const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function start(data) {
    if (!_.isNil(data.nextContext)) {
        data.nextContext.stop();
    }

    data.thenContext.start();
}

function onValid(control, contents) {
    const data = control.data;

    const isCondition = data.isCondition;

    if (isCondition === 'string' && _.isString(contents)) {
        start(data);
    } else if (isCondition === 'number' && _.isFinite(contents)) {
        start(data);
    } else if (isCondition === 'boolean' && _.isBoolean(contents)) {
        start(data);
    } else if (isCondition === 'date' && Common.isDate(contents)) {
        start(data);
    } else if (isCondition === 'object' && _.isPlainObject(contents)) {
        start(data);
    } else if (isCondition === 'array' && _.isArray(contents)) {
        start(data);
    } else if (_.isNil(isCondition)) {
        start(data);
    } else {
        data.thenContext.stop();

        if (!_.isNil(data.nextContext)) {
            data.nextContext.start();
        } else {
            control.raise({ type: 'schema', message: 'Invalid value type', severity: 'error' });
        }
    }
}

function onStop(control) {
    const data = control.data;

    if (!_.isNil(data.nextContext)) {
        data.nextContext.stop();
    }

    data.thenContext.stop();
}

function onBuild(control) {
    const data = control.data;

    data.thenContext = control.createRuleContext(data.thenRule);
    data.nextContext = !_.isNil(data.logic) ? control.buildLogicContext(data.logic) : null;
}

function isLogic(isCondition, thenRule, nextIs) {
    return {
        options: {
            data: {
                isCondition,
                thenRule,
                logic: _.isNil(nextIs) ? null : Logic('full', nextIs)
            }
        },
        onBuild,
        onValid,
        onStop,
        onDispose: onStop
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

            const logic = Logic('full', finalLogic);

            return Rule('is', logic);
        }
    };

    return isActions;
}

module.exports = isAction;
