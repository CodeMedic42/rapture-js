const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function start(control, content) {
    const data = control.data;

    const contents = content.contents;

    if (_.isNil(contents) || !_.isArray(contents)) {
        // Do nothing
        return;
    }

    data.contexts = _.reduce(contents, (contexts, propValue, index) => {
        const ruleContext = control.createRuleContext(data.rule, propValue);
        ruleContext.data.$index = index;

        contexts.push(ruleContext);

        ruleContext.start();

        return contexts;
    }, []);
}

function clean(control) {
    const data = control.data;

    const commits = [];

    _.forEach(data.contexts, (context) => {
        if (!_.isNil(context)) {
            commits.push(context.dispose().commit);
        }
    });

    _.forEach(commits, (commit) => {
        commit();
    });

    data.contexts = null;
}

function itemsAction(parentRule, actions, rule) {
    if (!(rule instanceof Rule)) {
        throw new Error('ItemRule must be a Rule');
    }

    const logic = Logic('full', {
        options: {
            useToken: true,
            data: {
                rule
            }
        },
        onStart: start,
        onStop: clean,
        onDispose: clean
    });

    const nextActions = _.clone(actions);

    delete nextActions.items;

    return Rule('array-items', logic, nextActions, parentRule);
}

module.exports = itemsAction;
