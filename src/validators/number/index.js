const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function numberDefinition(parentRule) {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.onRun((runContext, value) => {
            if (!_.isNil(value) && !_.isFinite(value)) {
                runContext.raise('schema', 'When defined this field must be a number.', 'error');
            } else {
                runContext.raise();
            }
        });
    });

    const actions = {
        register: registerAction,
        if: ifAction
    };

    return Rule('number', logicDefinition, actions, parentRule);
}

module.exports = numberDefinition;
