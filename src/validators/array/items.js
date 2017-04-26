const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function disposeContexts(context, currentContexts) {
    const commits = [];

    _.forEach(currentContexts, (paramContext /* , propertyName */) => {
        if (!_.isNil(paramContext)) {
            commits.push(paramContext.dispose().commit);
        }
    });

    _.forEach(commits, (commit) => {
        commit();
    });
}

function itemsAction(parentRule, actions, itemRule) {
    if (!(itemRule instanceof Rule) && !_.isFunction(itemRule)) {
        throw new Error('ItemRule must be a Rule or setup function');
    }

    const logic = Logic({
        options: {
            useToken: true
        },
        define: { id: 'itemRule', value: itemRule },
        onRun: (context, content, params, currentContexts) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isArray(contents)) {
                // Do nothing
                return null;
            }

            disposeContexts(context, currentContexts);

            return _.reduce(contents, (contexts, propValue) => {
                const ruleContext = context.createRuleContext(params.itemRule, propValue);

                contexts.push(ruleContext);

                ruleContext.start();

                return contexts;
            }, []);
        },
        onPause: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        },
        onTeardown: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        }
    });

    const nextActions = _.clone(actions);

    delete nextActions.items;

    return Rule('array-items', logic, nextActions, parentRule);
}

module.exports = itemsAction;
