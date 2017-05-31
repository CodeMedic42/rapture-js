const _ = require('lodash');
const RegisterAction = require('./register');
const Logic = require('../../logic.js');
const Observable = require('../../observable/index.js');

function onBuild(control) {
    const data = control.data;

    data.reference = Observable({});

    control.set(data.reference);
}

function onDispose(control) {
    const data = control.data;

    data.reference.dispose();

    data.reference = null;
}

function ReferenceAction(parentRule, actions, refId) {
    let id;
    let scope;

    if (_.isString(refId)) {
        id = refId;
    } else if (_.isPlainObject(refId)) {
        id = refId.id;
        scope = refId.scope;
    } else {
        throw new Error('Must be a string or an object');
    }

    return RegisterAction(parentRule, actions, {
        id,
        scope,
        value: Logic('set', {
            onBuild,
            onDispose,
        })
    });
}

module.exports = ReferenceAction;
