const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const minAction = require('./min.js');
const maxAction = require('./max.js');
const lengthAction = require('./length.js');
const validAction = require('./valid.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const customAction = require('../common/custom.js');

function stringDefinition(parentRule) {
    const logic = Logic({
        onRun: (runContext, value) => {
            if (!_.isNil(value) && !_.isString(value)) {
                runContext.raise('schema', 'When defined this field must be a string.', 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const actions = {
        min: minAction,
        max: maxAction,
        valid: validAction,
        length: lengthAction,
        register: registerAction,
        if: ifAction,
        custom: customAction
    };

    return Rule('string', logic, actions, parentRule);
}

module.exports = stringDefinition;
