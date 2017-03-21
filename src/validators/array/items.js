const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function itemsAction(parentRule, actions, itemRule) {
    if (!(itemRule instanceof Rule) && !_.isFunction(itemRule)) {
        throw new Error('ItemRule must be a Rule or setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('itemContexts', (buildKeysSetup) => {
            buildKeysSetup.define('itemRule', itemRule);

            buildKeysSetup.onRun((runContext, value, params) => {
                if (_.isNil(value) || !_.isPlainObject(value)) {
                    // Do nothing
                    return null;
                }

                return _.reduce(value, (contexts, propValue) => {
                    const _contexts = contexts;

                    _contexts.push(runContext.buildContext(params.itemRule, propValue));

                    return _contexts;
                }, []);
            });
        });

        setupContext.onRun((runContext, contents, params) => {
            _.forOwn(params.itemContexts, (context) => {
                context.start();
            });
        });

        setupContext.onPause((runContext, contents, params) => {
            _.forOwn(params.keyContexts, (context) => {
                context.stop();
            });
        });
    }, true, true);

    const nextActions = _.clone(actions);

    delete nextActions.items;

    return Rule(logicDefinition, nextActions, parentRule);
}

module.exports = itemsAction;
