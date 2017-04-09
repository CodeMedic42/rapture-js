const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

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

    return (setupContext) => {
        if (!_.isNil(ifCondition)) {
            setupContext.define('if', ifCondition);
        }

        let logicDef;

        if (!_.isNil(nextIf)) {
            logicDef = LogicDefinition(nextIf);
        }

        setupContext.onSetup((control) => {
            return {
                thenContext: control.createRuleContext(thenRule),
                nextContext: !_.isNil(logicDef) ? control.buildLogicContext(logicDef) : null
            };
        });

        // setupContext.define('thenContext', (buildThenSetup) => {
        //     buildThenSetup.onSetup((control) => {
        //         // Create another RuleContext off of original RunContext
        //
        //         return control.createRuleContext(thenRule);
        //     });
        // });

        // if (!_.isNil(nextIf)) {
        //     const logicDef = LogicDefinition(nextIf);
        //
        //     setupContext.define('nextContext', (buildNextSetup) => {
        //         buildNextSetup.onSetup((control) => {
        //             return control.buildLogicContext(logicDef);
        //         });
        //     });
        // }

        setupContext.onRun(onRun);
        setupContext.onPause(onPause);
    };
}

function ifAction(parentRule, actions, ifCondition, thenLogic) {
    const logicList = [];

    logicList.unshift(ifLogic.bind(null, ifCondition, thenLogic, actions));

    const ifActions = {
        elseIf: (childIfCondition, childThenLogic) => {
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

            const logicDefinition = LogicDefinition(finalLogic);

            return Rule('if', logicDefinition, {}, parentRule);
        }
    };

    return ifActions;
}

module.exports = ifAction;
