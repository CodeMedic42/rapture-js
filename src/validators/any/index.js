const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function anyDefinition(parentRule) {
    const anyActions = {
        register: registerAction,
        if: ifAction
    };

    const logicDefinition = LogicDefinition(() => {});

    return Rule('any', logicDefinition, anyActions, parentRule);
}

module.exports = anyDefinition;
