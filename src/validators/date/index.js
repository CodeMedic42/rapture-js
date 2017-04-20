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
        onRun: (runContext, value) => {
            if (!_.isNil(value) && !Common.isDate(value)) {
                runContext.raise('schema', 'When defined this field must be a date.', 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction,
        registered: registeredAction,
        custom: customAction
    };

    return Rule('date', logic, actions, parentRule);
};
