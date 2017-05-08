const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');

module.exports = (parentRule) => {
    const logic = Logic({
        onRun: (context, content) => {
            if (!_.isNil(content) && !Common.isDate(content)) {
                context.raise('schema', 'When defined this field must be a date.', 'error');
            } else {
                context.raise();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction
    };

    return Rule('date', logic, actions, parentRule);
};
