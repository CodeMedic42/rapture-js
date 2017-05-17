const _ = require('lodash');
const Rule = require('../../rule.js');

function customAction(parentRule, actions, id, logic) {
    let _id = id;
    let _logic = logic;

    if (_.isNil(logic)) {
        _id = 'custom';
        _logic = id;
    }

    return Rule(_id, _logic, actions, parentRule);
}

module.exports = customAction;
