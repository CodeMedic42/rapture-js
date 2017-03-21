const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function onRun(runContext, value, params) {
    if (!_.isNil(params.if) && params.if) {
        if (!_.isNil(params.nextContext)) {
            params.nextContext.stop();
        }

        params.thenContext.start();
    } else {
        params.thenContext.stop();

        if (!_.isNil(params.nextContext)) {
            params.nextContext.start();
        }
    }
}

function onPause(runContext, contents, params) {
    if (!_.isNil(params.nextContext)) {
        params.nextContext.stop();
    }

    params.thenContext.stop();
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

        setupContext.define('thenContext', (buildThenSetup) => {
            buildThenSetup.onSetup((runContext) => {
                return runContext.buildContext(thenRule, null, true);
            });
        });

        if (!_.isNil(nextIf)) {
            const logicDef = LogicDefinition(nextIf);

            setupContext.define('nextContext', (buildNextSetup) => {
                buildNextSetup.onSetup((runContext) => {
                    return runContext.buildLogicContext(logicDef);
                });
            });
        }

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

            return Rule(logicDefinition, {}, parentRule);
        }
    };

    return ifActions;
}

module.exports = ifAction;
