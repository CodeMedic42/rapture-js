const Semver = require('semver');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');
const toReferenceAction = require('../common/toReference.js');

function onValid(context, content) {
    if (!Semver.valid(content)) {
        context.raise('schema', 'Must be a valid version string.', 'error');
    } else {
        context.clear();
    }
}

// const logic = Logic('raise', {
//     positional: true,
//     content: {
//         state: true,
//         watch: 'shallow',
//         type: 'token' || 'raw'
//     },
//     require: {},
//     define: {},
//     onValid
// });

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
