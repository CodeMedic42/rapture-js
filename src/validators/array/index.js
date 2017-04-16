const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const itemsAction = require('./items.js');

const minAction = require('./min.js');
const maxAction = require('./max.js');
const lengthAction = require('./length.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

const arrayLogic = Logic({
    onRun: (runContext, value) => {
        if (!_.isNil(value) && !_.isArray(value)) {
            runContext.raise('schema', 'When defined this field must be an array', 'error');
        } else {
            runContext.raise();
        }
    }
});

const actions = {
    min: minAction,
    max: maxAction,
    length: lengthAction,
    items: itemsAction,
    register: registerAction,
    if: ifAction
};

function arrayDefinition(parentRule) {
    return Rule('array', arrayLogic, actions, parentRule);
}

module.exports = arrayDefinition;
