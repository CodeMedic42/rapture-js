const _ = require('lodash');
const RegisterAction = require('./register');
const Logic = require('../../logic.js');
const Observable = require('../../observable/index.js');

function ListAction(parentRule, actions, data) {
    let id;
    let scope;

    if (_.isString(data)) {
        id = data;
    } else if (_.isPlainObject(data)) {
        id = data.id;
        scope = data.scope;
    } else {
        throw new Error('Must be a string or an object');
    }

    return RegisterAction(parentRule, actions, {
        id,
        scope,
        value: Logic({
            onSetup: (control) => {
                const _control = control;

                _control.data[control.id] = Observable({});

                control.set(control.data[control.id]);
            },
            onTeardown: (control) => {
                control.data[control.id].dispose();
            }
        })
    });
}

module.exports = ListAction;
