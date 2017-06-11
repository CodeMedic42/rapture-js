const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onValid(control, content, params) {
    if (_.isArray(content) && content.length > params.maxData) {
        control.raise('schema', `Must be less than ${params.maxData + 1} items long.`, 'error');
    } else {
        control.clear();
    }
}

function maxAction(parentRule, actions, maxData) {
    if (!_.isFinite(maxData) && !_.isFunction(maxData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logic = Logic('raise', {
        define: { id: 'maxData', value: maxData },
        onValid
    });

    const nextActions = _.clone(actions);

    return Rule('array-max', logic, nextActions, parentRule);
}

module.exports = maxAction;
