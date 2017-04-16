const _ = require('lodash');
const object = require('./validators/object');
const array = require('./validators/array');
const string = require('./validators/string');
const number = require('./validators/number');
const any = require('./validators/any');
const version = require('./validators/version');
const SessionContext = require('./sessionContext.js');
const ifAction = require('./validators/common/if.js');
const ScopeRule = require('./scopeRule.js');
const Logic = require('./logic.js');
const Observable = require('./observable.js');

const initialActions = {
    any,
    object,
    array,
    string,
    number,
    version,
    if: (ifCondition, thenLogic) => {
        return ifAction(null, initialActions, ifCondition, thenLogic);
    },
    logic: Logic,
    observable: Observable
};

module.exports = _.merge({
    scope: ScopeRule.bind(null, initialActions),
    createSessionContext: SessionContext,
}, initialActions);
