const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

// function defaultPredicate = () => {}

function uniqueAction(parentRule, actions) {
    const logic = Logic({
        options: {
            useToken: true
        },
        onRun: (context, content) => {
            const contents = content.contents;

            if (_.isArray(contents)) {
                const issues = [];
                const offended = {};

                _.forEach(contents, (targetItem, index) => {
                    const targetItemContents = targetItem.contents;

                    const retIndex = _.findIndex(content, item => item === targetItemContents, index + 1);

                    if (retIndex >= 0 && !offended[retIndex]) {
                        offended[retIndex] = true;

                        const targetOffender = contents[retIndex];

                        issues.push({ type: 'schema', message: 'Must be unique', severity: 'error', from: targetOffender.from, location: targetOffender.location });
                    }
                });

                context.raise(issues);
            } else {
                context.raise();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('array-length', logic, nextActions, parentRule);
}

module.exports = uniqueAction;
