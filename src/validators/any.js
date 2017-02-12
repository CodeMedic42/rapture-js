const Rule = require('../rule.js');
const LogicDefinition = require('../logicDefinition.js');

function anyDefinition() {
    const anyActions = {};

    const logicDefinition = LogicDefinition((runContext, value) => {
        // There is no possible test which can be done here.
    });

    return Rule(logicDefinition, anyActions);
}

module.exports = anyDefinition;
