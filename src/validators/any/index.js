const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');
const registerAction = require('../common/register.js');

function anyDefinition() {
    const anyActions = {
        register: registerAction
    };

    const logicDefinition = LogicDefinition(() => {});

    return Rule(logicDefinition, anyActions);
}

module.exports = anyDefinition;
