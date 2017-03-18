const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');
const Observable = require('../../observable.js');

const keysAction = require('./keys.js');
const requiredAction = require('./required.js');
const registerAction = require('../common/register.js');

function evaluateForInvalidKeys(runContext, keyData, value) {
    const issues = [];

    runContext.clear();

    _.forEach(keyData.get(), (propRefCount, propName) => {
        if (propRefCount.get() <= 0) {
            const propValue = value[propName];

            issues.push({ type: 'schema', message: `The property "${propName}" is not allowed to exist.`, severity: 'error', from: propValue.from, location: propValue.location });
        }

        runContext.raise(issues);
    });
}

function objectDefinition() {
    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.register('__keyData', '__rule', (__keyDataSetupContext) => {
            __keyDataSetupContext.onSetup((runContext, contents) => {
                const keyData = {};

                _.reduce(contents, (current, childValue, childName) => {
                    const cur = current;

                    cur[childName] = 0;

                    return cur;
                }, keyData);

                return Observable(keyData);
            });
        });

        setupContext.onRun((runContext, value, params) => {
            runContext.clear();

            if (!_.isNil(value) && !_.isPlainObject(value)) {
                runContext.raise('schema', 'When defined this field must be a plain object', 'error');
            } else {
                params.__keyData.on('change', evaluateForInvalidKeys.bind(null, runContext, params.__keyData, value));

                evaluateForInvalidKeys(runContext, params.__keyData, value);
            }
        });

        setupContext.onPause((runContext, value, params) => {
            params.__keyData.removeAllListenters();
        });
    }, true);

    const objectActions = {
        keys: keysAction,
        required: requiredAction,
        register: registerAction
    };

    return Rule(logicDefinition, objectActions);
}

module.exports = objectDefinition;
