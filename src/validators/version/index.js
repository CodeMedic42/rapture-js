const Semver = require('semver');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');
const toReferenceAction = require('../common/toReference.js');

function onValid(control, content) {
    if (!Semver.valid(content)) {
        control.raise('schema', 'Must be a valid version string.', 'error');
    } else {
        control.clear();
    }
}

const logic = Logic('raise', {
    onValid
});

function versionDefinition(parentRule) {
    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction,
        toReference: toReferenceAction
    };

    return Rule('version', logic, actions, parentRule);
}

module.exports = versionDefinition;
