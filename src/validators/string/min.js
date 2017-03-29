const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function minAction(parentRule, actions, minData) {
    if (!_.isFinite(minData) && !_.isFunction(minData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('minData', minData);

        setupContext.onRun((runContext, value, params) => {
            if (_.isString(value) && value.length < params.minData) {
                runContext.raise('schema', `Must be greater than ${params.minData - 1} characters long.`, 'error');
            } else {
                runContext.raise();
            }
        });
    }, true);

    const nextActions = _.clone(actions);

    delete nextActions.min;
    delete nextActions.length;

    return Rule(logicDefinition, nextActions, parentRule);
}

module.exports = minAction;
