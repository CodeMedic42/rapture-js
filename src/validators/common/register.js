const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function registerAction(parentRule, actions, id, targetScope, value) {
    const logicComponents = {
        options: { onFaultChange: true },
        define: [{ id: 'registerID', value: id }],
        onRun: (runContext, contents, params, oldId) => {
            if (oldId !== params.registerID) {
                // If the old id is not the same as the new one then we need to unregister the old id.
                runContext.unregister(targetScope, oldId);
            }

            let targetValue = contents;

            if (Object.prototype.hasOwnProperty.call(params, 'registerValue')) {
                targetValue = params.registerValue;
            }

            // create/update the value in the targetScope.
            runContext.register(targetScope, params.registerID, targetValue, !runContext.isFaulted);

            // We are saving the previous id because the id might change later and we also what to unregister if we get paused.
            return params.registerID;
        },
        onPause: (runContext, contents, currentValue) => {
            runContext.unregister(targetScope, currentValue);
        }
    };

    if (!_.isNil(value)) {
        logicComponents.define.push({ id: 'registerValue', value });
    }

    const logic = Logic(logicComponents);

    return Rule('register', logic, actions, parentRule);
}

module.exports = registerAction;
