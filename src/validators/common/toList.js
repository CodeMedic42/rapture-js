const _ = require('lodash');
const Rule = require('../../rule.js');
const Common = require('../../common.js');
const Logic = require('../../logic.js');

function cleanUp(logicData, disenguageListener, currentCount, list, content) {
    const _logicData = logicData;

    _logicData.ran = false;

    if (!_.isNil(disenguageListener)) {
        disenguageListener();
    }

    const newValue = currentCount.value() - 1;

    if (newValue > 0) {
        currentCount.set(newValue);
    } else {
        list.delete(content);
    }

    currentCount.dispose();
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

            let currentCount = params[id].get(content);

            if (_.isNil(currentCount)) {
                params[id].set(content, 0);
                currentCount = params[id].get(content);
            }

            let disenguageListener;

            if (unique) {
                disenguageListener = Common.createListener(currentCount, 'change', null, () => {
                    if (content === 'submitted') {
                        debugger;
                    }

                    if (currentCount.value() > 1) {
                        context.raise({ type: 'schema', message: 'Must be a unique id.', severity: 'error' });
                    } else {
                        context.raise();
                    }
                });
            }

            currentCount.set(currentCount.value() + 1);

            logicData.cleanUp = cleanUp.bind(null, logicData, disenguageListener, currentCount, params[id], content);
            // () => {
            //     logicData.ran = false;
            //
            //     if (!_.isNil(disenguageListener)) {
            //         disenguageListener();
            //     }
            //
            //     const newValue = currentCount.value() - 1;
            //
            //     if (newValue > 0) {
            //         currentCount.set(newValue);
            //     } else {
            //         params[id].delete(content);
            //     }
            //
            //     currentCount.dispose();
            //     currentCount = null;
            // };
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
