const _ = require('lodash');
const Rule = require('../../rule.js');
const Common = require('../../common.js');
const Logic = require('../../logic.js');

function cleanUp(disenguageListener, currentCount, list, item) {
    if (!_.isNil(disenguageListener)) {
        disenguageListener();
    }

    const newValue = currentCount.value() - 1;

    if (newValue > 0) {
        currentCount.set(newValue);
    } else {
        list.delete(item);
    }

    currentCount.dispose();
}

function theLoop(list, item, token, control, unique) {
    let currentCount = list.get(item);

    if (_.isNil(currentCount)) {
        list.set(item, 0);
        currentCount = list.get(item);
    }

    let disenguageListener;

    if (unique) {
        disenguageListener = Common.createListener(currentCount, 'change', null, () => {
            if (currentCount.value() > 1) {
                control.raise({ type: 'schema', message: 'Must be a unique id.', severity: 'error', from: token.from, location: token.location });
            } else {
                control.raise();
            }
        });
    }

    currentCount.set(currentCount.value() + 1);

    return cleanUp.bind(null, disenguageListener, currentCount, list, item);
}

function customAction(parentRule, actions, listId, unique) {
    const logic = Logic({
        options: {
            useToken: true
        },
        require: { id: 'listId', value: listId },
        onSetup: (control) => {
            const _control = control;

            _control.data[control.id] = {};
        },
        onRun: (control, content, params) => {
            const logicData = control.data[control.id];

            if (logicData.ran) {
                logicData.cleanUp();
            }

            logicData.ran = true;
            const cleanUpList = [];

            if (_.isPlainObject(content.contents)) {
                _.forOwn(content.contents, (item, name) => {
                    cleanUpList.push(theLoop(params.listId, name, item, control, unique));
                });
            } else if (!_.isNil(content.contents)) {
                cleanUpList.push(theLoop(params.listId, content.contents, content, control, unique));
            }

            logicData.cleanUp = () => {
                logicData.ran = false;

                _.forEach(cleanUpList, cleanUpCb => cleanUpCb());
            };
        },
        onPause: (control) => {
            if (!_.isNil(control.data[control.id].cleanUp)) {
                control.data[control.id].cleanUp();
            }
        },
        onTeardown: (control) => {
            if (!_.isNil(control.data[control.id].cleanUp)) {
                control.data[control.id].cleanUp();
            }
        }
    });

    return Rule('toList', logic, actions, parentRule);
}

module.exports = customAction;
