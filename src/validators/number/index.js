const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function numberDefinition(parentRule) {
    const logic = Logic({
        onRun: (runContext, value) => {
            if (!_.isNil(value) && !_.isFinite(value)) {
                runContext.raise('schema', 'When defined this field must be a number.', 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction
    };

    return Rule('number', logic, actions, parentRule);
}

module.exports = numberDefinition;
