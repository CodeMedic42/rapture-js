const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Observable = require('../../observable.js');

const keysAction = require('./keys.js');
const matchAction = require('./match.js');
const requiredAction = require('./required.js');
const nandAction = require('./nand.js');
const xorAction = require('./xor.js');
const withoutAction = require('./without.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');

function evaluateForInvalidKeys(runContext, contents, keyData) {
    const keyStates = {};
    let enabled = false;

    const data = keyData.toJS();

    _.forOwn(data, (ruleState) => {
        if (!ruleState) {
            return;
        }

        enabled = true;

        _.forOwn(ruleState, (propertyValue, propertyName) => {
            if (propertyValue) {
                keyStates[propertyName] = true;
            }
        });
    });

    if (!enabled) {
        runContext.raise();

        return;
    }

    const issues = _.reduce(contents, (issArray, propertyValue, propertyName) => {
        if (keyStates[propertyName]) {
            return issArray;
        }

        issArray.push({ type: 'schema', message: `The property "${propertyName}" is not allowed to exist.`, severity: 'error', from: propertyValue.from, location: propertyValue.location });

        return issArray;
    }, []);

    runContext.raise(issues);
}

const objectLogic = Logic({
    onSetup: (runContext, value) => {
        const _runContext = runContext;

        _runContext.data.__keyData = Observable({
        }).on('change', function onChange() {
            evaluateForInvalidKeys(runContext, value, this);
        });
    },
    onRun: (runContext, value) => {
        if (!_.isNil(value) && !_.isPlainObject(value)) {
            runContext.raise('schema', 'When defined this field must be a plain object', 'error');
        } else {
            runContext.raise();
            runContext.data.__keyData.unpause();

            evaluateForInvalidKeys(runContext, value, runContext.data.__keyData);
        }
    },
    onPause: (runContext) => {
        runContext.data.__keyData.pause();
    }
});

const objectActions = {
    keys: keysAction,
    match: matchAction,
    nand: nandAction,
    xor: xorAction,
    without: withoutAction,
    required: requiredAction,
    register: registerAction,
    if: ifAction,
    registered: registeredAction,
    custom: customAction
};

function objectDefinition(parentRule) {
    return Rule('object', objectLogic, objectActions, parentRule);
}

module.exports = objectDefinition;
