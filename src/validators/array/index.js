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
const referenceAction = require('../common/reference.js');

function onValid(control, content) {
    if (!_.isNil(content) && !_.isArray(content)) {
        control.raise('schema', 'When defined this field must be an array', 'error');
    } else {
        control.clear();
    }
}

const arrayLogic = Logic('raise', {
    onValid
});

const actions = {
    min: minAction,
    max: maxAction,
    length: lengthAction,
    items: itemsAction,
    register: registerAction,
    if: ifAction.bind(null, true),
    registered: registeredAction,
    custom: customAction,
    reference: referenceAction
};

function arrayDefinition(parentRule) {
    return Rule('array', arrayLogic, actions, parentRule);
}

module.exports = arrayDefinition;
