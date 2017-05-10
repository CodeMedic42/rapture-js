const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

const itemsAction = require('./items.js');

const minAction = require('./min.js');
const maxAction = require('./max.js');
const lengthAction = require('./length.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');
const listAction = require('../common/list.js');

const arrayLogic = Logic({
    onRun: (context, content) => {
        if (!_.isNil(content) && !_.isArray(content)) {
            context.raise('schema', 'When defined this field must be an array', 'error');
        } else {
            context.raise();
        }
    }
});

const actions = {
    min: minAction,
    max: maxAction,
    length: lengthAction,
    items: itemsAction,
    // unique: uniqueAction,
    register: registerAction,
    if: ifAction.bind(null, true),
    registered: registeredAction,
    custom: customAction,
    list: listAction
};

function arrayDefinition(parentRule) {
    return Rule('array', arrayLogic, actions, parentRule);
}

module.exports = arrayDefinition;
