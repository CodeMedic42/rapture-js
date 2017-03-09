const _ = require('lodash');
const Rule = require('../rule.js');
const Issue = require('../issue.js');
const LogicDefinition = require('../logicDefinition.js');
const RuleContext = require('../ruleContext.js');
const TokenContext = require('../artifactLexing/tokenContext.js');

// Can take a plain object of keys
//     THis object can have regular key names or reg-exs as well
//
//     Can also take a loadFunction
function keysAction(parentRule, keyData) {
    if (!_.isPlainObject(keyData)) {
        throw new Error('Keys must be plain object');
    }

    const staticKeys = {};
    let regKeys = {};

    _.forOwn(keyData, (keyRule, keyPattern) => {
        if (_.isString(keyPattern)) {
            staticKeys[keyPattern] = keyRule;
        } else if (_.isRegExp(keyPattern)) {
            regKeys[keyPattern] = keyRule;
        } else {
            throw new Error('Key name must be a string or a regular expression');
        }
    });

    if (_.keys(regKeys).length == 0) {
        regKeys = null;
    }

    const logicDefinition = LogicDefinition((runContext, value) => {
        if (_.isNil(value) || !_.isPlainObject(value)) {
            // Do nothing
            return;
        }

        _.forOwn(value, (propValue, propName) => {
            let keyRule = staticKeys[propName];

            if (_.isNil(keyRule) && !_.isNil(regKeys)) {
                _.forOwn(regKeys, (regRule, regKey) => {
                    if (propName.matches(regKey)) {
                        keyRule = regRule;
                    }
                });
            }

            if (_.isNil(keyRule)) {
                runContext.raise('schema', `The property "${propName}" is not allowed to exist.`, 'error', propValue.from, propValue.location);

                return;
                // TODO: Register key as unfound? Create a rule to handle unfound keys. This keys could show up later.
            }

            const ruleContext = RuleContext(keyRule, runContext.scope, propValue);

            runContext.link(ruleContext);
        });
    });

    const objectActions = {};

    const rule = Rule(logicDefinition, objectActions, parentRule);

    rule.keys = keysAction.bind(null, rule);

    return rule;
}

function objectDefinition() {
    const logicDefinition = LogicDefinition((runContext, value) => {
        if (!_.isNil(value) && !_.isPlainObject(value)) {
            runContext.raise('schema', 'When defined this field must be a plain object', 'error');
        } else {
            runContext.clear();
        }
    });

    const objectActions = {};

    const rule = Rule(logicDefinition, objectActions);

    rule.keys = keysAction.bind(null, rule);

    return rule;
}

module.exports = objectDefinition;
