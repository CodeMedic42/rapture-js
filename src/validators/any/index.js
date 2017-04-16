const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function anyDefinition(parentRule) {
    const anyActions = {
        register: registerAction,
        if: ifAction
    };

    const logic = Logic({});

    return Rule('any', logic, anyActions, parentRule);
}

module.exports = anyDefinition;
