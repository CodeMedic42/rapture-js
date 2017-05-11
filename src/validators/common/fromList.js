const _ = require('lodash');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

module.exports = function fromList(listId, additionalItems) {
    function set(context, list, additionalValues) {
        context.set([..._.keys(list.value()), ...additionalValues]);
    }

    let _additionalItems = additionalItems;

    if (!_.isArray(additionalItems)) {
        _additionalItems = [];
    }

    return Logic({
        require: listId,
        onSetup: (context) => {
            const _context = context;

            _context.data[context.id] = {};
        },
        onRun: (context, content, params) => {
            const logicData = context.data[context.id];

            if (logicData.ran) {
                if (!_.isNil(context.data[context.id].disenguage)) {
                    context.data[context.id].disenguage();
                }
            }

            logicData.ran = true;

            if (!_.isNil(logicData.disenguage)) {
                logicData.disenguage();
            }

            logicData.disenguage = Common.createListener(params[listId], 'change', null, () => {
                set(context, params[listId], _additionalItems);
            }, () => {
                logicData.ran = false;

                logicData.disenguage = null;
            });

            set(context, params[listId], _additionalItems);
        },
        onPause: (context) => {
            if (!_.isNil(context.data[context.id].disenguage)) {
                context.data[context.id].disenguage();
            }
        },
        onTeardown: (context) => {
            if (!_.isNil(context.data[context.id].disenguage)) {
                context.data[context.id].disenguage();
            }
        }
    });
};
