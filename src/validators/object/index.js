const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');
const Observable = require('../../observable.js');

const keysAction = require('./keys.js');
const requiredAction = require('./required.js');
const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');

function evaluateForInvalidKeys(runContext, value, keyData) {
    const issues = [];

    runContext.clear();

    _.forEach(keyData.get(), (propRefCount, propName) => {
        if (propRefCount.get() <= 0) {
            const propValue = value[propName];

            issues.push({ type: 'schema', message: `The property "${propName}" is not allowed to exist.`, severity: 'error', from: propValue.from, location: propValue.location });
        }
    });

    runContext.raise(issues);
}

const logicDefinition = LogicDefinition((setupContext) => {
    setupContext.register('__keyData', '__rule', (__keyDataSetupContext) => {
        __keyDataSetupContext.onSetup((runContext, value) => {
            const keyData = _.reduce(value, (current, childValue, childName) => {
                const _current = current;

                _current[childName] = 0;

                return _current;
            }, {});

            return Observable(keyData).on('change', evaluateForInvalidKeys.bind(null, runContext, value));
        });
    });

    setupContext.require('__keyData');

    setupContext.onRun((runContext, value, params) => {
        runContext.clear();

        if (!_.isNil(value) && !_.isPlainObject(value)) {
            runContext.raise('schema', 'When defined this field must be a plain object', 'error');
        } else {
            params.__keyData.unpause();

            evaluateForInvalidKeys(runContext, value, params.__keyData);
        }
    });

    setupContext.onPause((runContext, value, params) => {
        params.__keyData.pause();
    });
}, true);

const objectActions = {
    keys: keysAction,
    required: requiredAction,
    register: registerAction,
    if: ifAction
};

function objectDefinition() {
    return Rule(logicDefinition, objectActions);
}

module.exports = objectDefinition;
