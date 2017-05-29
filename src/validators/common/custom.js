const _ = require('lodash');
const Logic = require('../../logic.js');
const Rule = require('../../rule.js');

function customAction(parentRule, actions, id, logicComponents) {
    let _id = id;
    let _logicComponents = logicComponents;

    if (_.isNil(_logicComponents)) {
        _id = 'custom';
        _logicComponents = id;
    }

    return Rule(_id, Logic('raise', _logicComponents), actions, parentRule);
}

module.exports = customAction;
