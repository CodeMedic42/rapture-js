const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function customAction(parentRule, actions, logic) {
    const logicDefinition = LogicDefinition(logic);

    return Rule(logicDefinition, actions, parentRule);
}

module.exports = customAction;
