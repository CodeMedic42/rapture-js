const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Observable = require('../../observable/index.js');

const validAction = require('./valid/index.js');
const invalidAction = require('./invalid.js');
const strictAction = require('./strict.js');
const requiredAction = require('./required.js');
const nandAction = require('./nand.js');
const xorAction = require('./xor.js');
const withoutAction = require('./without.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');
const referenceAction = require('../common/reference.js');
const toReferenceAction = require('../common/toReference.js');

function onBuild(control) {
    const data = control.data;

    data.$shared.__keyData = Observable({});
}

function onValid(control, content) {
    if (!_.isNil(content) && !_.isPlainObject(content)) {
        control.raise('schema', 'When defined this field must be a plain object', 'error');
    } else {
        control.clear();
    }
}

const objectLogic = Logic('raise', {
    onBuild,
    onValid
});

const objectActions = {
    valid: validAction,
    invalid: invalidAction,
    strict: strictAction,
    nand: nandAction,
    xor: xorAction,
    without: withoutAction,
    required: requiredAction,
    register: registerAction,
    if: ifAction.bind(null, true),
    registered: registeredAction,
    custom: customAction,
    reference: referenceAction,
    toReference: toReferenceAction
};

function objectDefinition(parentRule) {
    return Rule('object', objectLogic, objectActions, parentRule);
}

module.exports = objectDefinition;
