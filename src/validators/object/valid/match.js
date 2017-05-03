const _ = require('lodash');
const Rule = require('../../../rule.js');
const Logic = require('../../../logic.js');

function disposeContexts(context, currentContexts) {
    context.data.__keyData.set(context.id, false);

    const commits = [];

    _.forEach(currentContexts, (paramContext) => {
        if (!_.isNil(paramContext)) {
            commits.push(paramContext.dispose().commit);
        }
    });

    _.forEach(commits, (commit) => {
        commit();
    });
}

function buildContexts(context, contents, matchers, rule) {
    const keyData = {};

    const paramContexts = _.reduce(contents, (current, propValue, propertyName) => {
        let ruleContext = null;

        let matches = false;

        _.forEach(matchers, (matcher) => {
            matches = matcher(propertyName);

            return !matches;
        });

        if (!matches) {
            return current;
        }

        keyData[propertyName] = true;

        ruleContext = context.createRuleContext(rule, propValue);

        ruleContext.start();

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

function validateCleanMatchers(matchers, allowArray) {
    if (_.isNil(matchers)) {
        return null;
    } else if (_.isString(matchers)) {
        const cb = item => item === matchers;

        return allowArray ? [cb] : cb;
    } else if (_.isRegExp(matchers)) {
        const cb = item => item.match(matchers);

        return allowArray ? [cb] : cb;
    } else if (_.isArray(matchers)) {
        if (allowArray) {
            const array = _.reduce(matchers, (builder, item) => {
                builder.push(validateCleanMatchers(item, false));

                return builder;
            }, []);

            if (array.length > 0) {
                return array;
            }

            return null;
        }

        throw new Error('An array is not allowed inside of another array');
    }

    throw new Error('Must be either a string, regular expression, an array of the former two, or a Rapture Logic definition if not already loaded through one');
}

function buildMatchLogicComponents(matchers, rule) {
    validateRule(rule);

    let cleanedMatchers;
    let needsCleaned = true;

    if (matchers instanceof Logic) {
        cleanedMatchers = matchers;
    } else {
        cleanedMatchers = validateCleanMatchers(matchers, true);
        needsCleaned = false;
    }

    if (_.isNil(cleanedMatchers)) {
        return null;
    }

    return {
        options: {
            useToken: true
        },
        define: { id: 'matchers', value: cleanedMatchers },
        onRun: (context, content, params, currentContexts) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return null;
            }

            disposeContexts(context, currentContexts);

            let finalMatchers = params.matchers;

            if (needsCleaned) {
                finalMatchers = validateCleanMatchers(params.matchers, true);
            }

            if (_.isNil(finalMatchers)) {
                return [];
            }

            return buildContexts(context, contents, finalMatchers, rule);
        },
        onPause: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        },
        onTeardown: (context, contents, currentContexts) => {
            disposeContexts(context, currentContexts);
        }
    };
}

module.exports = buildMatchLogicComponents;
