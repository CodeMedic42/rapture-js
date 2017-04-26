const Semver = require('semver');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');

function versionDefinition(parentRule) {
    const logic = Logic({
        onRun: (runContext, value) => {
            if (!Semver.valid(value)) {
                runContext.raise('schema', 'Must be a valid version string.', 'error');
            } else {
                runContext.raise();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction
    };

    return Rule('version', logic, actions, parentRule);
}

module.exports = versionDefinition;
