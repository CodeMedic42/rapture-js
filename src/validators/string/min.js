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
                runContext.clear();
            }
        });
    }, true);

    delete actions.min; // eslint-disable-line no-param-reassign
    delete actions.length; // eslint-disable-line no-param-reassign

    return Rule(logicDefinition, actions, parentRule);
}

module.exports = minAction;
