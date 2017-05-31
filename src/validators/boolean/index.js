const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');

module.exports = (parentRule) => {
    const logic = Logic('raise', {
        onValid: (context, content) => {
            if (!_.isNil(content) && !_.isBoolean(content)) {
                context.raise('schema', 'When defined this field must be a boolean.', 'error');
            } else {
                context.clear();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction
    };

    return Rule('boolean', logic, actions, parentRule);
};
