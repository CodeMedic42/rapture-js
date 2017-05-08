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
const registeredAction = require('../common/registered.js');

function stringDefinition(parentRule) {
    const logic = Logic({
        onRun: (context, content) => {
            if (!_.isNil(content) && !_.isString(content)) {
                context.raise('schema', 'When defined this field must be a string.', 'error');
            } else {
                context.raise();
            }
        }
    });

    const actions = {
        min: minAction,
        max: maxAction,
        valid: validAction,
        length: lengthAction,
        register: registerAction,
        if: ifAction.bind(null, true),
        custom: customAction,
        registered: registeredAction
    };

    return Rule('string', logic, actions, parentRule);
}

module.exports = stringDefinition;
