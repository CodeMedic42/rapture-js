const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function customAction(parentRule, actions, id, logic) {
    let _id = id;
    let _logic = logic;

    if (_.isNil(logic)) {
        _id = 'custom';
        _logic = id;
    }

    const logicDefinition = LogicDefinition(_logic);

    return Rule(_id, logicDefinition, actions, parentRule);
}

module.exports = customAction;
