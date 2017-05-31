const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function minAction(parentRule, actions, minData) {
    if (!_.isFinite(minData) && !(minData instanceof Logic)) {
        throw new Error('Must be a finite value or a Rapture logic instance');
    }

    const logic = Logic('raise', {
        define: { id: 'minData', value: minData },
        onValid: (control, content, params) => {
            if (_.isString(content) && content.length < params.minData) {
                control.raise('schema', `Must be greater than ${params.minData - 1} characters long.`, 'error');
            } else {
                control.clear();
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('string-min', logic, nextActions, parentRule);
}

module.exports = minAction;
