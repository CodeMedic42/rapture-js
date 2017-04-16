const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function itemsAction(parentRule, actions, itemRule) {
    if (!(itemRule instanceof Rule) && !_.isFunction(itemRule)) {
        throw new Error('ItemRule must be a Rule or setup function');
    }

    const logic = Logic({
        define: { id: 'itemRule', value: itemRule },
        onRun: (control, contents, params, currentContexts) => {
            if (_.isNil(contents) || !_.isArray(contents)) {
                // Do nothing
                return null;
            }

            _.forEach(currentContexts, (context) => {
                context.destroy();
            });

            return _.reduce(contents, (contexts, propValue) => {
                const ruleContext = control.createRuleContext(params.itemRule, propValue);

                contexts.push(ruleContext);

                ruleContext.start();

                return contexts;
            }, []);
        },
        onPause: (control, contents, currentContexts) => {
            _.forEach(currentContexts, (context) => {
                context.stop();
            });
        }
    });

    const nextActions = _.clone(actions);

    delete nextActions.items;

    return Rule('array-items', logic, nextActions, parentRule);
}

module.exports = itemsAction;
