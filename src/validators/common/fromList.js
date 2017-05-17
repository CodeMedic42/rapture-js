const _ = require('lodash');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

module.exports = function fromList(listId, additionalItems) {
    function set(control, list, additionalValues) {
        control.set([..._.keys(list.value()), ...additionalValues]);
    }

    let _additionalItems = additionalItems;

    if (!_.isArray(additionalItems)) {
        _additionalItems = [];
    }

    return Logic({
        require: listId,
        onSetup: (control) => {
            const _control = control;

            _control.data[control.id] = {};
        },
        onRun: (control, content, params) => {
            const logicData = control.data[control.id];

            if (logicData.ran) {
                if (!_.isNil(logicData.disenguage)) {
                    logicData.disenguage();
                }
            }

            logicData.ran = true;

            if (!_.isNil(logicData.disenguage)) {
                logicData.disenguage();
            }

            logicData.disenguage = Common.createListener(params[listId], 'change', null, () => {
                set(control, params[listId], _additionalItems);
            }, () => {
                logicData.ran = false;

                logicData.disenguage = null;
            });

            set(control, params[listId], _additionalItems);
        },
        onPause: (control) => {
            if (!_.isNil(control.data[control.id].disenguage)) {
                control.data[control.id].disenguage();
            }
        },
        onTeardown: (control) => {
            if (!_.isNil(control.data[control.id].disenguage)) {
                control.data[control.id].disenguage();
            }
        }
    });
};
