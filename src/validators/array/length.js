const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function lengthAction(parentRule, actions, lengthData) {
    if (!_.isFinite(lengthData) && !_.isFunction(lengthData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logic = Logic({
        define: { id: 'lengthData', value: lengthData },
        onRun: (runContext, value, params) => {
            if (_.isArray(value) && value.length !== params.lengthData) {
                runContext.raise('schema', `Must be ${params.lengthData} items long.`, 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('array-length', logic, nextActions, parentRule);
}

module.exports = lengthAction;
