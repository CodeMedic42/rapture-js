const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function maxAction(parentRule, actions, maxData) {
    if (!_.isFinite(maxData) && !_.isFunction(maxData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('maxData', maxData);

        setupContext.onRun((runContext, value, params) => {
            if (_.isArray(value) && value.length > params.maxData) {
                runContext.raise('schema', `Must be less than ${params.maxData + 1} items long.`, 'error');
            } else {
                runContext.raise();
            }
        });
    });

    const nextActions = _.clone(actions);

    return Rule('array-max', logicDefinition, nextActions, parentRule);
}

module.exports = maxAction;
