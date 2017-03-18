const Semver = require('semver');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');
const registerAction = require('../common/register.js');

function versionDefinition() {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.onRun((runContext, value) => {
            if (!Semver.valid(value)) {
                runContext.raise('schema', 'Must be a valid version string.', 'error');
            } else {
                runContext.clear();
            }
        });
    }, true);

    const actions = {
        register: registerAction
    };

    return Rule(logicDefinition, actions);
}

module.exports = versionDefinition;
