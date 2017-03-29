const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

const minAction = require('./min.js');
const maxAction = require('./max.js');
const lengthAction = require('./length.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const customAction = require('../common/custom.js');

function stringDefinition() {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.onRun((runContext, value) => {
            if (!_.isNil(value) && !_.isString(value)) {
                runContext.raise('schema', 'When defined this field must be a string.', 'error');
            } else {
                runContext.raise();
            }
        });
    }, true);

    const actions = {
        min: minAction,
        max: maxAction,
        length: lengthAction,
        register: registerAction,
        if: ifAction,
        custom: customAction
    };

    return Rule(logicDefinition, actions);
}

module.exports = stringDefinition;
