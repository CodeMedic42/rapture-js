const Rule = require('../rule.js');
const LogicDefinition = require('../logicDefinition.js');

function anyDefinition() {
    const anyActions = {};

    const logicDefinition = LogicDefinition(() => {});

    return Rule(logicDefinition, anyActions);
}

module.exports = anyDefinition;
