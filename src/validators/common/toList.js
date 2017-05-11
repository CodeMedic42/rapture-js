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

function theLoop(list, item, context, unique) {
    let currentCount = list.get(item);

    if (_.isNil(currentCount)) {
        list.set(item, 0);
        currentCount = list.get(item);
    }

    let disenguageListener;

    if (unique) {
        disenguageListener = Common.createListener(currentCount, 'change', null, () => {
            if (currentCount.value() > 1) {
                context.raise({ type: 'schema', message: 'Must be a unique id.', severity: 'error' });
            } else {
                context.raise();
            }
        });
    }

    currentCount.set(currentCount.value() + 1);

    return cleanUp.bind(null, disenguageListener, currentCount, list, item);
}

function customAction(parentRule, actions, id, unique) {
    const logic = Logic({
        require: id,
        onSetup: (context) => {
            const _context = context;

            _context.data[context.id] = {};
        },
        onRun: (context, content, params) => {
            const logicData = context.data[context.id];

            if (logicData.ran) {
                logicData.cleanUp();
            }

            logicData.ran = true;
            const cleanUpList = [];

            if (_.isPlainObject(content)) {
                _.forOwn(content, (item, name) => {
                    cleanUpList.push(theLoop(params[id], name, context, false));
                });
            } else if (!_.isNil(content)) {
                cleanUpList.push(theLoop(params[id], content, context, unique));
            }

            logicData.cleanUp = () => {
                logicData.ran = false;

                _.forEach(cleanUpList, cleanUpCb => cleanUpCb());
            };
        },
        onPause: (context) => {
            if (!_.isNil(context.data[context.id].cleanUp())) {
                context.data[context.id].cleanUp();
            }
        },
        onTeardown: (context) => {
            if (!_.isNil(context.data[context.id].cleanUp())) {
                context.data[context.id].cleanUp();
            }
        }
    });

    return Rule('toList', logic, actions, parentRule);
}

module.exports = customAction;
