const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onValid(control, content, params) {
    const data = control.data;

    if (!_.isNil(params.if) && params.if) {
        if (!_.isNil(data.nextContext)) {
            data.nextContext.stop();
        }

        data.thenContext.start();
    } else {
        data.thenContext.stop();

        if (!_.isNil(data.nextContext)) {
            data.nextContext.start();
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

function onDispose(control) {
    const data = control.data;

    if (!_.isNil(data.nextContext)) {
        data.nextContext.dispose().commit();
    }

    data.thenContext.dispose().commit();
}

function onBuild(control) {
    const data = control.data;

    data.thenContext = control.createRuleContext(data.thenRule);
    data.nextContext = !_.isNil(data.logicDef) ? control.buildLogicContext(data.logicDef) : null;
}

function ifLogic(isContinue, ifCondition, thenLogic, actions, nextIf) {
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
        logicDef = Logic('full', nextIf);
    }

    const logicComponents = {
        options: {
            data: {
                thenRule,
                logicDef
            }
        },
        onBuild,
        onValid,
        onInvalid: onStop,
        onStop,
        onDispose
    };

    if (!_.isNil(ifCondition)) {
        logicComponents.define = { id: 'if', value: ifCondition };
    }

    return logicComponents;
}

function ifAction(isContinue, parentRule, actions, ifCondition, thenLogic) {
    if (!(ifCondition instanceof Logic)) {
        throw new Error('Must provide some logic for the if component');
    }

    const logicList = [];

    logicList.unshift(ifLogic.bind(null, isContinue, ifCondition, thenLogic, actions));

    const ifActions = {
        elseIf: (childIfCondition, childThenLogic) => {
            if (!(childIfCondition instanceof Logic)) {
                throw new Error('Must provide some logic for the if component');
            }

            logicList.unshift(ifLogic.bind(null, isContinue, childIfCondition, childThenLogic, actions));

            return ifActions;
        },
        else: (childThenLogic) => {
            logicList.unshift(ifLogic.bind(null, isContinue, null, childThenLogic, actions));

            return ifActions.endIf();
        },
        endIf: () => {
            const finalLogic = _.reduce(logicList, (nextIf, logicFun) => {
                return logicFun(nextIf);
            }, null);

            const logic = Logic('full', finalLogic);

            const nextActions = _.clone(actions);

            return Rule('if', logic, nextActions, parentRule);
        }
    };

    return ifActions;
}

module.exports = ifAction;
