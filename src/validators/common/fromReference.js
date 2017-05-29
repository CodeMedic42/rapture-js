const _ = require('lodash');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function cleanUp(control) {
    const data = control.data;

    if (!_.isNil(data.disenguage)) {
        data.disenguage();

        data.disenguage = null;
    }
}

function set(control, list) {
    control.set([..._.keys(list.value()), ...control.data.items]);
}

function onValid(control, content, params) {
    const data = control.data;

    cleanUp(control);

    data.disenguage = Common.createListener(params[data.listId], 'change', null, () => {
        set(control, params[data.listId]);
    });

    set(control, params[data.listId]);
}

module.exports = function fromReference(listId, additionalItems) {
    return Logic('set', {
        options: {
            data: {
                items: _.isArray(additionalItems) ? additionalItems : [],
                listId
            }
        },
        require: listId,
        onValid,
        onInvalid: cleanUp,
        onStop: cleanUp,
        onDispose: cleanUp
    });
};
