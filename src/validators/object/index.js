const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Observable = require('../../observable.js');

const keysAction = require('./keys.js');
const matchAction = require('./match.js');
const requiredAction = require('./required.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function evaluateForInvalidKeys(runContext, value, keyData) {
    let keyRuleRunning = false;

    _.forOwn(keyData.get('rules').value, (enabled) => {
        keyRuleRunning = keyRuleRunning || enabled.value;

        return !keyRuleRunning;
    });

    if (!keyRuleRunning) {
        runContext.raise();

        return;
    }

    const finalIssues = _.reduce(keyData.get('keys').value, (issues, propRefCount, propName) => {
        if (propRefCount.value <= 0) {
            const propValue = value[propName];
            issues.push({ type: 'schema', message: `The property "${propName}" is not allowed to exist.`, severity: 'error', from: propValue.from, location: propValue.location });
        }

        return issues;
    }, []);

    runContext.raise(finalIssues);
}

const objectLogic = Logic({
    onSetup: (runContext, value) => {
        const _runContext = runContext;

        const keys = _.reduce(value, (current, childValue, childName) => {
            const _current = current;

            _current[childName] = 0;

            return _current;
        }, {});

        _runContext.data.__keyData = Observable({
            rules: {},
            keys
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
    required: requiredAction,
    register: registerAction,
    if: ifAction
};

function objectDefinition(parentRule) {
    return Rule('object', objectLogic, objectActions, parentRule);
}

module.exports = objectDefinition;
