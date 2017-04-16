const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function disposeContexts(control, currentContexts) {
    _.forEach(currentContexts, (context, propertyName) => {
        control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
            return keyCount - 1;
        });

        if (!_.isNil(context)) {
            context.dispose();
        }
    });
}

function validateKeys(control, keys) {
    if (_.isNil(keys)) {
        // If nothing is provided then all keys are allowed, as far as this instance of this rule is concerned.

        control.data.__keyData.set(`rules.${control.id}`, false);

        // But there are no rules to validate to.
        return false;
    } else if (!_.isPlainObject(keys)) {
        control.data.__keyData.set(`rules.${control.id}`, false);

        control.raise('rule', 'Keys must either be undefined, null, or a plain object', 'error');

        return false;
    }

    return true;
}

function buildContexts(control, contents, keys, allowAll) {
    return _.reduce(contents, (current, propValue, propertyName) => {
        let ruleContext = null;

        const keyRule = keys[propertyName];

        if (_.isNil(keyRule)) {
            if (!allowAll) {
                return current;
            }

            control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
                return keyCount + 1;
            });
        } else {
            control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
                return keyCount + 1;
            });

            ruleContext = control.createRuleContext(keyRule, propValue);

            ruleContext.start();
        }

        const _current = current;

        _current[propertyName] = ruleContext;

        return _current;
    }, {});
}

function keysAction(parentRule, actions, keyData, options) {
    if (_.isNil(keyData)) {
        return parentRule;
    }

    if (!_.isPlainObject(keyData) && !(keyData instanceof Logic)) {
        throw new Error('Keys must be null, a plain object, or a Rapture logic instance');
    }

    const _options = options || {};

    const logic = Logic({
        define: { id: 'keys', value: keyData },
        onRun: (control, contents, params, currentContexts) => {
            // TODO: const transaction = params.__keyData.startTransaction();

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return null;
            }

            disposeContexts(control, currentContexts);

            if (!validateKeys(control, params.keys)) {
                return [];
            }

            control.data.__keyData.set(`rules.${control.id}`, true);

            return buildContexts(control, contents, params.keys, _options.allowAll);

            // TODO: transaction.commitTransaction();
        },
        onPause: (control, contents, currentContexts) => {
            // TODO: const transaction = control.data.__keyData.startTransaction();

            control.data.__keyData.set(`rules.${control.id}`, false);

            _.forEach(currentContexts, (context, propertyName) => {
                control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
                    return keyCount - 1;
                });

                if (!_.isNil(context)) {
                    context.stop();
                }
            });

            // TODO: transaction.commitTransaction();
        }
    });

    return Rule('object-keys', logic, actions, parentRule);
}

module.exports = keysAction;
