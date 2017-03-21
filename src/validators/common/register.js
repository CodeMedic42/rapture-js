const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function registerAction(parentRule, actions, id, targetScope, value) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = '__working';
    }

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

        setupContext.register(id, _targetScope, val);
    });

    return Rule(logicDefinition, { register: actions.register }, parentRule);
}

module.exports = registerAction;
