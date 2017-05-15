const Semver = require('semver');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');
const toListAction = require('../common/toList');

function versionDefinition(parentRule) {
    const logic = Logic({
        onRun: (context, content) => {
            if (!Semver.valid(content)) {
                context.raise('schema', 'Must be a valid version string.', 'error');
            } else {
                context.raise();
            }
        }
    });

    const actions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction,
        custom: customAction,
        toList: toListAction
    };

    return Rule('version', logic, 'full', actions, parentRule);
}

module.exports = versionDefinition;
