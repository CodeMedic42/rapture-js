const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function disposeContexts(context, currentContexts) {
    context.data.__keyData.set(context.id, false);

    const commits = [];

    _.forEach(currentContexts, (paramContext /* , propertyName */) => {
        if (!_.isNil(paramContext)) {
            commits.push(paramContext.dispose().commit);
        }
    });

    _.forEach(commits, (commit) => {
        commit();
    });
}

function validateKeys(context, keys) {
    if (_.isNil(keys)) {
        // If nothing is provided then all keys are allowed, as far as this instance of this rule is concerned.

        context.data.__keyData.set(context.id, false);

        // But there are no rules to validate to.
        return false;
    } else if (!_.isPlainObject(keys)) {
        context.data.__keyData.set(context.id, false);

        context.raise('rule', 'Keys must either be undefined, null, or a plain object', 'error');

        return false;
    }

    return true;
}

function buildContexts(context, contents, keys, allowAll) {
    const keyData = {};

    const paramContexts = _.reduce(contents, (current, propValue, propertyName) => {
        let ruleContext = null;

        const keyRule = keys[propertyName];

        if (_.isNil(keyRule)) {
            if (!allowAll) {
                return current;
            }

            keyData[propertyName] = true;
        } else {
            keyData[propertyName] = true;

            ruleContext = context.createRuleContext(keyRule, propValue);

            ruleContext.start();
        }

        const _current = current;

        _current[propertyName] = ruleContext;

        return _current;
    }, {});

    context.data.__keyData.set(context.id, keyData);

    return paramContexts;
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
        onRun: (context, contents, params, currentContexts) => {
            // TODO: const transaction = params.__keyData.startTransaction();

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return null;
            }

            disposeContexts(context, currentContexts);

            if (!validateKeys(context, params.keys)) {
                return [];
            }

            return buildContexts(context, contents, params.keys, _options.allowAll);
        },
        onPause: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        },
        onTeardown: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        }
    });

    return Rule('object-keys', logic, actions, parentRule);
}

module.exports = keysAction;
