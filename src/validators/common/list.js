const RegisterAction = require('./register');
const Logic = require('../../logic.js');
const Observable = require('../../observable/index.js');

function ListAction(parentRule, actions, id) {
    return RegisterAction(parentRule, actions, {
        id,
        value: Logic({
            onSetup: (context) => {
                const _context = context;

                _context.data[context.id] = Observable({});

                return context.data[context.id];
            },
            onTeardown: (context) => {
                context.data[context.id].dispose();
            }
        })
    });
}

module.exports = ListAction;
