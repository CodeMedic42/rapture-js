const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function cleanUp(control) {
    const data = control.data;

    if (!_.isNil(data.listener)) {
        data.listener();

        data.listener = null;
    }
}

function onValid(control, contents, params) {
    const data = control.data;

    // const logicValue = control.data[control.id];

    if (data.id === params.registerID) {
        // The id did not change and we do not need to update anything.
        return;
    }

    cleanUp(control);

    data.id = params.registerID;

    data.listener = control.scope.watch(params.registerID, (status) => {
        if (status === 'undefined') {
            control.raise('data', `${params.registerID} is referenced but is never registered`);
        } else {
            control.clear();
        }
    });
}

function registeredAction(parentRule, actions, id) {
    const logic = Logic('full', {
        define: [{ id: 'registerID', value: id }],
        onValid,
        onInvalid: cleanUp,
        onStop: cleanUp,
        onDispose: cleanUp
    });

    return Rule('register', logic, actions, parentRule);
}

module.exports = registeredAction;
