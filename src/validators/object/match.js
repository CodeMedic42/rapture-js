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

function buildContexts(control, contents, rule, matcher, allowAll) {
    return _.reduce(contents, (current, propValue, propertyName) => {
        let ruleContext = null;

        let matches = false;

        if (_.isArray(matcher)) {
            _.forEach(matcher, (item) => {
                matches = !!propertyName.match(item);

                return !matches;
            });
        } else {
            matches = !_.isNil(propertyName.match(matcher));
        }

        if (!matches) {
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

            ruleContext = control.createRuleContext(rule, propValue);

            ruleContext.start();
        }

        const _current = current;

        _current[propertyName] = ruleContext;

        return _current;
    }, {});
}

function validateRule(rule) {
    if (!(rule instanceof Rule)) {
        throw new Error('Rule is required');
    }
}

function validateCleanMatcher(matcher, allowLogic) {
    if (_.isNil(matcher)) {
        return null;
    }

    let _matcher = matcher;

    if (_.isArray(matcher)) {
        if (matcher.length <= 0) {
            return null;
        }

        _.forEach(matcher, (item) => {
            if (!_.isRegExp(item)) {
                throw new Error('Only regular expressions are allowed to be enumerated');
            }
        });
    } else if (_.isRegExp(matcher)) {
        _matcher = [matcher];
    } else if (!(matcher instanceof Logic) || !allowLogic) {
        throw new Error('Only regular expressions, arrays of regular expressions, or Rapture logic objects which result in either of the first two are allowed');
    }

    return _matcher;
}

function matchAction(parentRule, actions, rule, matcher, options) {
    validateRule(rule);

    const _matcher = validateCleanMatcher(matcher, true);

    if (_.isNil(_matcher)) {
        return parentRule;
    }

    const _options = options || {};

    const logicComponents = {
        onRun: (control, contents, params, currentContexts) => {
            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return null;
            }

            disposeContexts(control, currentContexts);

            let finalMatcher = _matcher;

            if (!_.isNil(logicComponents.define)) {
                finalMatcher = validateCleanMatcher(params.loadedMatcher, false);

                if (_.isNil(finalMatcher)) {
                    return [];
                }
            }

            control.data.__keyData.set(`rules.${control.id}`, true);

            return buildContexts(control, contents, rule, finalMatcher, _options.allowAll);

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
    };

    if (matcher instanceof Logic) {
        logicComponents.define = { id: 'loadedMatcher', value: _matcher };
    }

    return Rule('object-match', Logic(logicComponents), actions, parentRule);
}

module.exports = matchAction;
