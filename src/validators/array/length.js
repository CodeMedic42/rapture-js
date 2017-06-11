const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onValid(control, content, params) {
    if (_.isArray(content) && content.length !== params.lengthData) {
        control.raise('schema', `Must be ${params.lengthData} items long.`, 'error');
    } else {
        control.clear();
    }
}

function lengthAction(parentRule, actions, lengthData) {
    if (!_.isFinite(lengthData) && !_.isFunction(lengthData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logic = Logic('raise', {
        define: { id: 'lengthData', value: lengthData },
        onValid
    });

    const nextActions = _.clone(actions);

    return Rule('array-length', logic, nextActions, parentRule);
}

module.exports = lengthAction;
