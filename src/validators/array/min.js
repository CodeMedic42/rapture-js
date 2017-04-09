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
            if (_.isArray(value) && value.length < params.minData) {
                runContext.raise('schema', `Must be greater than ${params.minData - 1} items long.`, 'error');
            } else {
                runContext.raise();
            }
        });
    });

    const nextActions = _.clone(actions);

    return Rule('array-min', logicDefinition, nextActions, parentRule);
}

module.exports = minAction;
