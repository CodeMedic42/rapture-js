const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onRun(context, content, params) {
    const currentValue = context.data[context.id];

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
}

function onPause(context) {
    const currentValue = context.data[context.id];

    if (!_.isNil(currentValue.nextContext)) {
        currentValue.nextContext.stop();
    }

    currentValue.thenContext.stop();
}

function onTeardown(context) {
    const currentValue = context.data[context.id];

    if (!_.isNil(currentValue.nextContext)) {
        currentValue.nextContext.dispose().commit();
    }

    currentValue.thenContext.dispose().commit();
}

// TODO: Remove parentRule
function ifLogic(isContinue, ifCondition, thenLogic, actions, parentRule, nextIf) {
    let thenRule = null;

    if (isContinue) {
        if (!_.isFunction(thenLogic)) {
            throw new Error('Must provide a function call in then clause.');
        }

        const continueRule = Rule('continueHook', null, actions, null);

        thenRule = thenLogic(continueRule);

        if (!(thenRule instanceof Rule)) {
            throw new Error('please continue from current rule');
        }

        if (thenRule.groupId !== continueRule.groupId) {
            throw new Error('please continue from current rule');
        }
    } else {
        thenRule = thenLogic;

        if (!(thenRule instanceof Rule)) {
            throw new Error('Must provide a rule');
        }
    }

    let logicDef;

    if (!_.isNil(nextIf)) {
        logicDef = Logic(nextIf);
    }

    const logicContents = {
        onSetup: (context) => {
            const _context = context;

            _context.data[context.id] = {
                thenContext: context.createRuleContext(thenRule),
                nextContext: !_.isNil(logicDef) ? context.buildLogicContext(logicDef) : null
            };
        },
        onRun,
        onPause,
        onTeardown
    };

    if (!_.isNil(ifCondition)) {
        logicContents.define = { id: 'if', value: ifCondition };
    }

    return logicContents;
}

function ifAction(isContinue, parentRule, actions, ifCondition, thenLogic) {
    if (!(ifCondition instanceof Logic)) {
        throw new Error('Must provide some logic for the if component');
    }

    const logicList = [];

    logicList.unshift(ifLogic.bind(null, isContinue, ifCondition, thenLogic, actions, parentRule));

    const ifActions = {
        elseIf: (childIfCondition, childThenLogic) => {
            if (!(childIfCondition instanceof Logic)) {
                throw new Error('Must provide some logic for the if component');
            }

            logicList.unshift(ifLogic.bind(null, isContinue, childIfCondition, childThenLogic, actions, parentRule));

            return ifActions;
        },
        else: (childThenLogic) => {
            logicList.unshift(ifLogic.bind(null, isContinue, null, childThenLogic, actions, parentRule));

            return ifActions.endIf();
        },
        endIf: () => {
            const finalLogic = _.reduce(logicList, (nextIf, logicFun) => {
                return logicFun(nextIf);
            }, null);

            const logic = Logic(finalLogic);

            const nextActions = _.clone(actions);

            return Rule('if', logic, 'full', nextActions, parentRule);
        }
    };

    return ifActions;
}

module.exports = ifAction;
