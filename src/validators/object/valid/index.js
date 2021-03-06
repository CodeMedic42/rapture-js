const _ = require('lodash');
const Keys = require('./keys.js');
const Match = require('./match.js');
const Rule = require('../../../rule.js');
const Logic = require('../../../logic.js');

function validAction(parentRule, actions, ...logicData) {
    if (logicData.length === 0) {
        return parentRule;
    }

    let logicComponents;

    if (logicData.length === 1) {
        if (logicData[0] instanceof Rule) {
            logicComponents = Match(/[\s\S]*/, logicData[0]);
        } else {
            logicComponents = Keys(logicData[0]);
        }
    } else if (logicData.length === 2) {
        logicComponents = Match(logicData[0], logicData[1]);
    } else {
        throw new Error('Too many parameters');
    }

    if (_.isNil(logicComponents)) {
        return parentRule;
    }

    const nextActions = _.clone(actions);

    return Rule('object-valid', Logic('full', logicComponents), nextActions, parentRule);
}

module.exports = validAction;
