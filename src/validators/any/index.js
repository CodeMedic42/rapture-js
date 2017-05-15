const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');

function anyDefinition(parentRule) {
    const anyActions = {
        register: registerAction,
        if: ifAction.bind(null, true),
        registered: registeredAction
    };

    const logic = Logic({});

    return Rule('any', logic, 'full', anyActions, parentRule);
}

module.exports = anyDefinition;
