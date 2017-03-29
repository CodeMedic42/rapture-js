const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function useContents(valSetupContext) {
    valSetupContext.onSetup((runContext, contents) => {
        return contents;
    });
}

function registerAction(parentRule, actions, id, targetScope, value) {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.options({
            onFaultChange: true
        });

        const val = _.isNil(value) ? useContents : value;

        setupContext.define('val', val);
        setupContext.define('id', id);

        setupContext.onRun((runContext, contents, params) => {
            runContext.register(targetScope, params.id, params.val, !runContext.isFaulted);

            return params.id;
        });

        setupContext.onPause((runContext, contents, currentValue) => {
            runContext.unregister(targetScope, currentValue);
        });
    }, true);

    return Rule(logicDefinition, actions, parentRule);
}

module.exports = registerAction;
