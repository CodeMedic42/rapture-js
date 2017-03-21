const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function numberDefinition() {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.onRun((runContext, value) => {
            if (!_.isNil(value) && !_.isFinite(value)) {
                runContext.raise('schema', 'When defined this field must be a number.', 'error');
            } else {
                runContext.clear();
            }
        });
    }, true);

    const actions = {
        register: registerAction,
        if: ifAction
    };

    return Rule(logicDefinition, actions);
}

module.exports = numberDefinition;
