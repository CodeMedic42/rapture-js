const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onValid(control, value, params) {
    const data = control.data;

    if (!_.isNil(data.id) && data.id !== params.registerID) {
        // If the old id is not the same as the new one then we need to unregister the old id.
        control.unregister(data.scope, data.id);
    }

    data.id = params.registerID;

    control.register(data.scope, params.registerID, value, true);
}

function onValidContent(control, content, params) {
    onValid(control, content, params);
}

function onValidDefined(control, content, params) {
    onValid(control, params.registerValue, params);
}

function onInvalid(control, value, params, paramsState) {
    const data = control.data;

    if (!_.isNil(data.id) &&
    (paramsState.registerID === 'failing' || data.id !== params.registerID)) {
        control.unregister(data.scope, data.id);

        data.id = null;
    }

    if (paramsState.registerID !== 'defined') {
        return;
    }

    data.id = params.registerID;

    control.register(data.scope, params.registerID, value, false);
}

function onInvalidContent(control, content, params, paramsState) {
    onInvalid(control, content, params, paramsState);
}

function onInvalidDefined(control, content, params, paramsState) {
    onInvalid(control, params.registerValue, params, paramsState);
}

function onStop(control) {
    const data = control.data;

    if (!_.isNil(data.id)) {
        control.unregister(data.scope, data.id);

        data.id = null;
    }
}

function registerAction(parentRule, actions, registerData) {
    let id = registerData;
    let scope = null;
    let value = null;

    if (_.isPlainObject(registerData)) {
        id = registerData.id;
        scope = registerData.scope;
        value = registerData.value;
    }

    if (!_.isString(id) && !(id instanceof Logic)) {
        throw new Error('ID must be a string or an Rapture logic object which results in a string');
    }

    if (!_.isNil(scope) && !_.isString(scope)) {
        throw new Error('When defined scope must be a string');
    }

    const logicComponents = {
        options: { data: { scope } },
        define: [{ id: 'registerID', value: id }],
        onStop
    };

    if (_.isNil(value)) {
        logicComponents.options.content = {
            affectsValidState: true,
            watch: 'deep'
        };
        logicComponents.options.value = { content: true };
        logicComponents.options.contentWatch = 'deep';

        logicComponents.onValid = onValidContent;
        logicComponents.onInvalid = onInvalidContent;
    } else {
        logicComponents.define.push({ id: 'registerValue', value });

        logicComponents.onValid = onValidDefined;
        logicComponents.onInvalid = onInvalidDefined;
    }

    const logic = Logic('full', logicComponents);

    return Rule('register', logic, actions, parentRule);
}

module.exports = registerAction;
