const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function keysAction(parentRule, actions, keyData) {
    if (!_.isPlainObject(keyData) && !_.isFunction(keyData)) {
        throw new Error('Keys must be plain object');
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('keyContexts', (buildKeysSetup) => {
            buildKeysSetup.define('keys', keyData);

            buildKeysSetup.onRun((runContext, value, params) => {
                if (_.isNil(value) || !_.isPlainObject(value)) {
                    // Do nothing
                    return null;
                }

                return _.reduce(value, (current, propValue, propName) => {
                    const keyRule = params.keys[propName];

                    if (_.isNil(keyRule)) {
                        return current;
                    }

                    const _current = current;

                    _current[propName] = runContext.buildContext(keyRule, propValue); // eslint-disable-line

                    return _current;
                }, {});
            });
        });

        setupContext.require('__keyData');

        setupContext.onRun((runContext, contents, params) => {
            params.__keyData.manipulate((currentValue) => {
                const _currentValue = currentValue;

                _.forOwn(params.keyContexts, (context, keyName) => {
                    _currentValue[keyName] += 1;

                    context.start();
                });

                return _currentValue;
            });
        });

        setupContext.onPause((runContext, contents, params) => {
            params.__keyData.manipulate((currentValue) => {
                const _currentValue = currentValue;

                _.forOwn(params.keyContexts, (context, keyName) => {
                    _currentValue[keyName] -= 1;

                    context.stop();
                });

                return _currentValue;
            });
        });
    }, true, true);

    return Rule(logicDefinition, actions, parentRule);
}

module.exports = keysAction;
