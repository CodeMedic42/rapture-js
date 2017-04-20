const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function maxAction(parentRule, actions, maxData) {
    if (!_.isFinite(maxData) && !_.isFunction(maxData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logic = Logic({
        define: { id: 'maxData', value: maxData },

        onRun: (runContext, value, params) => {
            if (_.isArray(value) && value.length > params.maxData) {
                runContext.raise('schema', `Must be less than ${params.maxData + 1} items long.`, 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('array-max', logic, nextActions, parentRule);
}

module.exports = maxAction;
