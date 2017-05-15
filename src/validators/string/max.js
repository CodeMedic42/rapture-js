const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function maxAction(parentRule, actions, maxData) {
    if (!_.isFinite(maxData) && !(maxData instanceof Logic)) {
        throw new Error('Must be a finite value or a Rapture logic instance');
    }

    const logic = Logic({
        define: { id: 'maxData', value: maxData },
        onRun: (context, content, params) => {
            if (_.isString(content) && content.length > params.maxData) {
                context.raise('schema', `Must be less than ${params.maxData + 1} characters long.`, 'error');
            } else {
                context.raise();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('string-max', logic, 'full', nextActions, parentRule);
}

module.exports = maxAction;
