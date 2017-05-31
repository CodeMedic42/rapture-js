const _ = require('lodash');
const Rule = require('../../../rule.js');

function disposeContexts(control) {
    control.data.$shared.__keyData.set(control.id, false);

    const commits = [];

    _.forOwn(control.data.contexts, (paramContext) => {
        if (!_.isNil(paramContext)) {
            commits.push(paramContext.dispose().commit);
        }
    });

    _.forEach(commits, (commit) => {
        commit();
    });
}

function buildContexts(control, contents, keys) {
    const keyData = {};

    const paramContexts = _.reduce(contents, (current, propValue, propertyName) => {
        let ruleContext = null;

        const keyRule = keys[propertyName];

        if (_.isNil(keyRule)) {
            return current;
        }

        keyData[propertyName] = true;

        ruleContext = control.createRuleContext(keyRule, propValue);

        ruleContext.start();

        const _current = current;

        _current[propertyName] = ruleContext;

        return _current;
    }, {});

    control.data.$shared.__keyData.set(control.id, keyData);

    const _control = control;

    _control.data.contexts = paramContexts;
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
        onValid: (control, content) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return;
            }

            disposeContexts(control);

            buildContexts(control, contents, keys);
        },
        onInvalid: disposeContexts,
        onStop: disposeContexts,
        onDispose: disposeContexts
    };
}

module.exports = buildKeysLogicComponents;
