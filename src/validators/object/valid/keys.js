const _ = require('lodash');
const Rule = require('../../../rule.js');

function disposeContexts(context) {
    context.data.__keyData.set(context.id, false);

    const commits = [];

    _.forOwn(context.data[context.id], (paramContext) => {
        if (!_.isNil(paramContext)) {
            commits.push(paramContext.dispose().commit);
        }
    });

    _.forEach(commits, (commit) => {
        commit();
    });
}

function buildContexts(context, contents, keys) {
    const keyData = {};

    const paramContexts = _.reduce(contents, (current, propValue, propertyName) => {
        let ruleContext = null;

        const keyRule = keys[propertyName];

        if (_.isNil(keyRule)) {
            return current;
        }

        keyData[propertyName] = true;

        ruleContext = context.createRuleContext(keyRule, propValue);

        ruleContext.start();

        const _current = current;

        _current[propertyName] = ruleContext;

        return _current;
    }, {});

    context.data.__keyData.set(context.id, keyData);

    const _context = context;

    _context.data[context.id] = paramContexts;
}

function validateKeys(keys) {
    if (_.isNil(keys)) {
        return false;
    }

    if (!_.isPlainObject(keys)) {
        throw new Error('Keys must be null or a plain object with Rapture Rules as property values');
    }

    let keysExist = false;

    _.forOwn(keys, (rule) => {
        keysExist = true;

        if (rule instanceof Rule) {
            return;
        }

        throw new Error('Property values must be Rapture Rules');
    });

    return keysExist;
}

function buildKeysLogicComponents(keys) {
    if (!validateKeys(keys)) {
        return null;
    }

    return {
        options: {
            useToken: true
        },
        onRun: (context, content) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return;
            }

            disposeContexts(context);

            buildContexts(context, contents, keys);
        },
        onPause: (context) => {
            disposeContexts(context);
        },
        onTeardown: (context) => {
            disposeContexts(context);
        }
    };
}

module.exports = buildKeysLogicComponents;
