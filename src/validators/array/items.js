const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function disposeContexts(currentContexts) {
    const commits = [];

    _.forEach(currentContexts, (paramContext) => {
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
        onRun: (context, content, params) => {
            const _context = context;
            const contents = content.contents;

            if (_.isNil(contents) || !_.isArray(contents)) {
                // Do nothing
                return;
            }

            disposeContexts(context.data[context.id]);

            _context.data[context.id] = _.reduce(contents, (contexts, propValue) => {
                const ruleContext = context.createRuleContext(params.itemRule, propValue);

                contexts.push(ruleContext);

                ruleContext.start();

                return contexts;
            }, []);
        },
        onPause: (context) => {
            disposeContexts(context.data[context.id]);
        },
        onTeardown: (context) => {
            disposeContexts(context.data[context.id]);
        }
    });

    const nextActions = _.clone(actions);

    delete nextActions.items;

    return Rule('array-items', logic, nextActions, parentRule);
}

module.exports = itemsAction;
