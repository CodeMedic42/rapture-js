const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onRun(control, value, params, currentValue) {
    if (!_.isNil(params.if) && params.if) {
        if (!_.isNil(currentValue.nextContext)) {
            currentValue.nextContext.stop();
        }

        currentValue.thenContext.start();
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

function ifLogic(ifCondition, thenLogic, actions, nextIf) {
    const newActions = _.reduce(actions, (current, action, actionName) => {
        const _current = current;

        _current[actionName] = action.bind(null, null, actions);

        return _current;
    }, {});

    const thenRule = thenLogic(newActions);

    if (!(thenRule instanceof Rule)) {
        throw new Error('Must provide a rule');
    }

    let logicDef;

    if (!_.isNil(nextIf)) {
        logicDef = Logic(nextIf);
    }

    const logicContents = {
        onSetup: (control) => {
            return {
                thenContext: control.createRuleContext(thenRule),
                nextContext: !_.isNil(logicDef) ? control.buildLogicContext(logicDef) : null
            };
        },
        onRun,
        onPause
    };

    if (!_.isNil(ifCondition)) {
        logicContents.define = { id: 'if', value: ifCondition };
    }

    return logicContents;
}

function ifAction(parentRule, actions, ifCondition, thenLogic) {
    if (!(ifCondition instanceof Logic)) {
        throw new Error('Must provide some logic for the if component');
    }

    const logicList = [];

    logicList.unshift(ifLogic.bind(null, ifCondition, thenLogic, actions));

    const ifActions = {
        elseIf: (childIfCondition, childThenLogic) => {
            if (!(childIfCondition instanceof Logic)) {
                throw new Error('Must provide some logic for the if component');
            }

            logicList.unshift(ifLogic.bind(null, childIfCondition, childThenLogic, actions));

            return ifActions;
        },
        else: (childThenLogic) => {
            logicList.unshift(ifLogic.bind(null, null, childThenLogic, actions));

            return ifActions.endIf();
        },
        endIf: () => {
            const finalLogic = _.reduce(logicList, (nextIf, logicFun) => {
                return logicFun(nextIf);
            }, null);

            const logic = Logic(finalLogic);

            const nextActions = _.clone(actions);

            return Rule('if', logic, nextActions, parentRule);
        }
    };

    return ifActions;
}

module.exports = ifAction;
