const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function lengthAction(parentRule, actions, lengthData) {
    if (!_.isFinite(lengthData) && !_.isFunction(lengthData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('lengthData', lengthData);

        setupContext.onRun((runContext, value, params) => {
            if (_.isString(value) && value.length !== params.lengthData) {
                runContext.raise('schema', `Must be ${params.lengthData} characters long.`, 'error');
            } else {
                runContext.raise();
            }
        });
    }, true);

    const nextActions = _.clone(actions);

    delete nextActions.min;
    delete nextActions.max;
    delete nextActions.length;

    return Rule(logicDefinition, nextActions, parentRule);
}

module.exports = lengthAction;
