const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');
const toReferenceAction = require('../common/toReference.js');

function numberDefinition(parentRule) {
    const logic = Logic('raise', {
        onValid: (context, content) => {
            if (!_.isNil(content) && !_.isFinite(content)) {
                context.raise('schema', 'When defined this field must be a number.', 'error');
            } else {
                context.clear();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction,
        toReference: toReferenceAction
    };

    return Rule('number', logic, actions, parentRule);
}

module.exports = numberDefinition;
