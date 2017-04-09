const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function keysAction(parentRule, actions, keyData) {
    if (!_.isPlainObject(keyData) && !_.isFunction(keyData)) {
        throw new Error('Keys must be plain object');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('keys', keyData);

        setupContext.onRun((control, targetObject, params, currentContexts) => {
            // TODO: const transaction = params.__keyData.startTransaction();

            if (_.isNil(targetObject) || !_.isPlainObject(targetObject)) {
                // Do nothing
                return null;
            }

            _.forEach(currentContexts, (context, propertyName) => {
                control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
                    return keyCount - 1;
                });

                context.destroy();
            });

            if (_.isNil(params.keys)) {
                control.data.__keyData.set(`rules.${control.id}`, false);
                // If nothing is provided then all keys are allowed, as far as this instance of this rule is concerned.
                return [];
            } else if (!_.isPlainObject(params.keys)) {
                this.raise('rule', 'Keys must either be undefined, null, or a plain object.', 'fatal');

                return null;
            }

            control.data.__keyData.set(`rules.${control.id}`, true);

            return _.reduce(targetObject, (current, propValue, propertyName) => {
                const keyRule = params.keys[propertyName];

                if (_.isNil(keyRule)) {
                    return current;
                }

                control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
                    return keyCount + 1;
                });

                const _current = current;

                const ruleContext = _current[propertyName] = control.createRuleContext(keyRule, propValue);

                ruleContext.start();

                return _current;
            }, {});

            // TODO: transaction.commitTransaction();
        });

        setupContext.onPause((control, contents, currentContexts) => {
            // TODO: const transaction = control.data.__keyData.startTransaction();

            control.data.__keyData.set(`rules.${control.id}`, false);

            _.forEach(currentContexts, (context, propertyName) => {
                control.data.__keyData.manipulate(`keys.${propertyName}`, (keyCount) => {
                    return keyCount - 1;
                });

                context.stop();
            });

            // TODO: transaction.commitTransaction();
        });
    });

    return Rule('object-keys', logicDefinition, actions, parentRule);
}

module.exports = keysAction;
