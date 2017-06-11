const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');

function onValid(control, content) {
    if (!_.isNil(content) && !_.isBoolean(content)) {
        control.raise('schema', 'When defined this field must be a boolean.', 'error');
    } else {
        control.clear();
    }
}

const logic = Logic('raise', {
    onValid
});

module.exports = (parentRule) => {
    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction
    };

    return Rule('boolean', logic, actions, parentRule);
};
