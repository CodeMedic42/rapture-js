const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onValid(control, content, params) {
    if (_.isArray(content) && content.length < params.minData) {
        control.raise('schema', `Must be greater than ${params.minData - 1} items long.`, 'error');
    } else {
        control.clear();
    }
}

function minAction(parentRule, actions, minData) {
    if (!_.isFinite(minData) && !_.isFunction(minData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logic = Logic('raise', {
        define: { id: 'minData', value: minData },
        onValid
    });

    const nextActions = _.clone(actions);

    return Rule('array-min', logic, nextActions, parentRule);
}

module.exports = minAction;
