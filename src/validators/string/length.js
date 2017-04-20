const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function lengthAction(parentRule, actions, lengthData) {
    if (!_.isFinite(lengthData) && !(lengthData instanceof Logic)) {
        throw new Error('Must be a finite value or a Rapture logic instance');
    }

    const logic = Logic({
        define: { id: 'lengthData', value: lengthData },
        onRun: (runContext, value, params) => {
            if (_.isString(value) && value.length !== params.lengthData) {
                runContext.raise('schema', `Must be ${params.lengthData} characters long.`, 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('string-length', logic, nextActions, parentRule);
}

module.exports = lengthAction;
