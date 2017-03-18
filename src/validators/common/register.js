const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function registerAction(parentRule, actions, id, targetScope, value) {
    const logicDefinition = LogicDefinition((setupContext) => {
        let val = value;

        if (_.isNil(val)) {
            // use contents
            val = (valSetupContext) => {
                valSetupContext.onSetup((runContext, contents) => {
                    return contents;
                });
            };
        }

        setupContext.register(id, targetScope, val);
    });

    return Rule(logicDefinition, { register: actions.register }, parentRule);
}

module.exports = registerAction;
