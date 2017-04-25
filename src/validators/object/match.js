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

function buildContexts(context, contents, rule, matcher, allowAll) {
    const keyData = {};

    const paramContexts = _.reduce(contents, (current, propValue, propertyName) => {
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

            keyData[propertyName] = true;
        } else {
            keyData[propertyName] = true;

            ruleContext = context.createRuleContext(rule, propValue);

            ruleContext.start();
        }

        const _current = current;

        _current[propertyName] = ruleContext;

        return _current;
    }, {});

    context.data.__keyData.set(context.id, keyData);

    return paramContexts;
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
        onRun: (context, contents, params, currentContexts) => {
            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return null;
            }

            disposeContexts(context, currentContexts);

            let finalMatcher = _matcher;

            if (!_.isNil(logicComponents.define)) {
                finalMatcher = validateCleanMatcher(params.loadedMatcher, false);

                if (_.isNil(finalMatcher)) {
                    return [];
                }
            }

            return buildContexts(context, contents, rule, finalMatcher, _options.allowAll);
        },
        onPause: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        },
        onTeardown: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        }
    };

    if (matcher instanceof Logic) {
        logicComponents.define = { id: 'loadedMatcher', value: _matcher };
    }

    return Rule('object-match', Logic(logicComponents), actions, parentRule);
}

module.exports = matchAction;
