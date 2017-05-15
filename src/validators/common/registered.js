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
        onSetup: (context) => {
            const _context = context;

            _context.data[context.id] = { id: null };
        },
        onRun: (context, contents, params) => {
            const logicValue = context.data[context.id];

            if (logicValue.id === params.registerID) {
                // The id did not change and we do not need to update anything.

                return;
            }

            context.raise();

            logicValue.id = params.registerID;

            logicValue.listener = context.scope.watch(params.registerID, (status) => {
                if (status === 'undefined') {
                    context.raise('data', `${params.registerID} is referenced but is never registered`);
                } else {
                    context.raise();
                }
            });
        },
        onPause: (context) => {
            cleanUp(context.data[context.id]);
        },
        onTeardown: (context) => {
            cleanUp(context.data[context.id]);
        }
    });

    return Rule('register', logic, 'full', actions, parentRule);
}

module.exports = registerAction;
