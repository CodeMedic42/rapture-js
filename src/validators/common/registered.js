const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function cleanUp(logicValue) {
    const _logicValue = logicValue;

    if (!_.isNil(_logicValue.listener)) {
        _logicValue.listener();
        _logicValue.listener = null;
    }
}

function registerAction(parentRule, actions, id) {
    const logic = Logic({
        define: [{ id: 'registerID', value: id }],
        onSetup: () => {
            return { id: null };
        },
        onRun: (context, contents, params, logicValue) => {
            if (logicValue.id === params.registerID) {
                // The id did not change and we do not need to update anything.

                return logicValue;
            }

            context.raise();

            const _logicValue = logicValue;

            _logicValue.id = params.registerID;

            _logicValue.listener = context.scope.watch(params.registerID, (status) => {
                if (status === 'undefined') {
                    context.raise('data', `${params.registerID} is referenced but is never registered`);
                } else {
                    context.raise();
                }
            });

            return logicValue;
        },
        onPause: (context, contents, logicValue) => {
            cleanUp(logicValue);
        },
        onTeardown: (context, contents, logicValue) => {
            cleanUp(logicValue);
        }
    });

    return Rule('register', logic, actions, parentRule);
}

module.exports = registerAction;
