const _ = require('lodash');
const Rule = require('../rule.js');
const Issue = require('../issue.js');
const LogicDefinition = require('../logicDefinition.js');
const RunDataContext = require('../runDataContext.js');

function minAction(parentRule, actions, minData) {
    if (!_.isFinite(minData) && !_.isFunction(minData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('testData', minData);

        setupContext.onRun((runContext, value) => {
            if (_.isNil(value) || !_.isString(value)) {
                runContext.clear();
            }

            const minValue = runContext.params.testData;

            if (value.length < minData) {
                runContext.raise('schema', `Must be ${minData} or more characters long.`, 'error');
            } else {
                runContext.clear();
            }
        });
    });

    delete actions.min;
    delete actions.length;

    return Rule(logicDefinition, actions, parentRule);
}

// function maxActionStatic(maxData, setupContext) {
//     setupContext.onRun((runContext, value) => {
//         if (_.isNil(value) || !_.isString(value)) {
//             runContext.clear();
//         }
//
//         if (value.length > maxData) {
//             runContext.raise('schema', `Must be less than ${maxData} or more characters long.`, 'error');
//         } else {
//             runContext.clear();
//         }
//     });
// }
//
// function maxAction(parentRule, actions, maxData) {
//     let cb;
//
//     if (_.isFunction(maxData)) {
//         logicDefinition = LogicDefinition(maxData);
//     } else if (_.isFinite(maxData)) {
//         logicDefinition = LogicDefinition(maxActionStatic.bind(null, maxData));
//     } else {
//         throw new Error('Must be a finite value or a setup function');
//     }
//
//     delete actions.max;
//     delete actions.length;
//
//     return Rule(logicDefinition, actions, parentRule);
// }
//
// function lengthActionStatic(lengthData, setupContext) {
//     setupContext.onRun((runContext, value) => {
//         if (_.isNil(value) || !_.isString(value)) {
//             runContext.clear();
//         }
//
//         if (value.length === lengthData) {
//             runContext.raise('schema', `Must be exactly ${lengthData} characters long.`, 'error');
//         } else {
//             runContext.clear();
//         }
//     });
// }
//
// function lengthAction(parentRule, actions, lengthData) {
//     let cb;
//
//     if (_.isFunction(lengthData)) {
//         logicDefinition = LogicDefinition(lengthData);
//     } else if (_.isFinite(lengthData)) {
//         logicDefinition = LogicDefinition(lengthActionStatic.bind(null, lengthData));
//     } else {
//         throw new Error('Must be a finite value or a setup function');
//     }
//
//     delete actions.max;
//     delete actions.length;
//
//     return Rule(logicDefinition, actions, parentRule);
// }

function stringDefinition() {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.onRun((runContext, value) => {
            if (!_.isNil(value) && !_.isString(value)) {
                runContext.raise('schema', 'When defined this field must be a string.', 'error');
            } else {
                runContext.clear();
            }
        });
    });

    const actions = {
        min: minAction,
        // max: maxAction,
        // length: lengthAction
    };

    return Rule(logicDefinition, actions);
}

module.exports = stringDefinition;
