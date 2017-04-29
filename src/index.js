const _ = require('lodash');
const object = require('./validators/object');
const array = require('./validators/array');
const string = require('./validators/string');
const number = require('./validators/number');
const date = require('./validators/date');
const boolean = require('./validators/boolean');
const any = require('./validators/any');
const version = require('./validators/version');
const SessionContext = require('./sessionContext.js');
const ifAction = require('./validators/common/if.js');
const isAction = require('./validators/common/is.js');
const deferAction = require('./validators/common/defer.js');
const scopeAction = require('./validators/common/scope.js');
const Logic = require('./logic.js');
const Observable = require('./observable.js');
const Compile = require('./compile.js');

const initialActions = {
    any,
    object,
    array,
    string,
    number,
    version,
    date,
    boolean
};

const final = _.merge({
    scope: scopeAction,
    createSessionContext: SessionContext,
    is: isAction,
    if: ifAction.bind(null, false, null, initialActions),
    defer: deferAction,
    logic: Logic,
    observable: Observable,
}, initialActions);

final.compile = Compile(final);

module.exports = final;
