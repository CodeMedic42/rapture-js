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
        onSetup: (control) => {
            const _control = control;

            _control.data[control.id] = { id: null };
        },
        onRun: (control, contents, params) => {
            const logicValue = control.data[control.id];

            if (logicValue.id === params.registerID) {
                // The id did not change and we do not need to update anything.

                return;
            }

            logicValue.id = params.registerID;

            logicValue.listener = control.scope.watch(params.registerID, (status) => {
                if (status === 'undefined') {
                    control.raise('data', `${params.registerID} is referenced but is never registered`);
                } else {
                    control.raise();
                }
            });
        },
        onPause: (control) => {
            cleanUp(control.data[control.id]);
        },
        onTeardown: (control) => {
            cleanUp(control.data[control.id]);
        }
    });

    return Rule('register', logic, actions, parentRule);
}

module.exports = registerAction;
