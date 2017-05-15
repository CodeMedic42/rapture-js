const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function minAction(parentRule, actions, minData) {
    if (!_.isFinite(minData) && !(minData instanceof Logic)) {
        throw new Error('Must be a finite value or a Rapture logic instance');
    }

    const logic = Logic({
        define: { id: 'minData', value: minData },
        onRun: (context, content, params) => {
            if (_.isString(content) && content.length < params.minData) {
                context.raise('schema', `Must be greater than ${params.minData - 1} characters long.`, 'error');
            } else {
                context.raise();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('string-min', logic, 'full', nextActions, parentRule);
}

module.exports = minAction;
