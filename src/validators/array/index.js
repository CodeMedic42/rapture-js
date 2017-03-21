const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

const itemsAction = require('./items.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

const logicDefinition = LogicDefinition((setupContext) => {
    setupContext.onRun((runContext, value) => {
        runContext.clear();

        if (!_.isNil(value) && !_.isArray(value)) {
            runContext.raise('schema', 'When defined this field must be an array', 'error');
        }
    });
}, true);

const actions = {
    items: itemsAction,
    register: registerAction,
    if: ifAction
};

function arrayDefinition() {
    return Rule(logicDefinition, actions);
}

module.exports = arrayDefinition;
