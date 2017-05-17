const RegisterAction = require('./register');
const Logic = require('../../logic.js');
const Observable = require('../../observable/index.js');

function ListAction(parentRule, actions, id) {
    return RegisterAction(parentRule, actions, {
        id,
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
