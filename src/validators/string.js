const _ = require('lodash');
const Rule = require('../rule.js');
const LogicDefinition = require('../logicDefinition.js');

function minAction(parentRule, actions, minData) {
    if (!_.isFinite(minData) && !_.isFunction(minData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('minData', minData);

        setupContext.onRun((runContext, value, params) => {
            if (_.isNil(value) || !_.isString(value)) {
                runContext.clear();
            }

            if (value.length < params.minData) {
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

function maxAction(parentRule, actions, maxData) {
    if (!_.isFinite(maxData) && !_.isFunction(maxData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('maxData', maxData);

        setupContext.onRun((runContext, value, params) => {
            if (_.isNil(value) || !_.isString(value)) {
                runContext.clear();
            }

            if (value.length > params.maxData) {
                runContext.raise('schema', `Must be less than ${params.maxData + 1} characters long.`, 'error');
            } else {
                runContext.clear();
            }
        });
    }, true);

    delete actions.max; // eslint-disable-line no-param-reassign
    delete actions.length; // eslint-disable-line no-param-reassign

    return Rule(logicDefinition, actions, parentRule);
}

function lengthAction(parentRule, actions, lengthData) {
    if (!_.isFinite(lengthData) && !_.isFunction(lengthData)) {
        throw new Error('Must be a finite value or a setup function');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('lengthData', lengthData);

        setupContext.onRun((runContext, value, params) => {
            if (_.isNil(value) || !_.isString(value)) {
                runContext.clear();
            }

            if (value.length !== params.lengthData) {
                runContext.raise('schema', `Must be ${params.lengthData} characters long.`, 'error');
            } else {
                runContext.clear();
            }
        });
    }, true);

    delete actions.min; // eslint-disable-line no-param-reassign
    delete actions.max; // eslint-disable-line no-param-reassign
    delete actions.length; // eslint-disable-line no-param-reassign

    return Rule(logicDefinition, actions, parentRule);
}

function stringDefinition() {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.onRun((runContext, value) => {
            if (!_.isNil(value) && !_.isString(value)) {
                runContext.raise('schema', 'When defined this field must be a string.', 'error');
            } else {
                runContext.clear();
            }
        });
    }, true);

    const actions = {
        min: minAction,
        max: maxAction,
        length: lengthAction
    };

    return Rule(logicDefinition, actions);
}

module.exports = stringDefinition;
