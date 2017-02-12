const _ = require('lodash');
const Rule = require('../rule.js');
const Issue = require('../issue.js');
const LogicDefinition = require('../logicDefinition.js');
const RuleContext = require('../ruleContext.js');
const TokenContext = require('../artifactLexing/tokenContext.js');

// function keysAction(expectedKeys) {
//     const rule = this;
//
//     if (!_.isPlainObject(expectedKeys)) {
//         throw new Error('must specify an object');
//     }
//
//     const allowedKeyNames = [];
//
//     _.forOwn(expectedKeys, (expectedKeyRuleDefinition, expectedKeyName) => {
//         allowedKeyNames.push(expectedKeyName);
//
//         rule.addLogicDefinition(LogicDefinition(`key_${expectedKeyName}`, function onRun(tokenContext) {
//             const logicContext = this;
//             const ruleContext = logicContext.ruleContext;
//
//             let observerdKeyValue = tokenContext.contents[expectedKeyName];
//
//             if (_.isNil(observerdKeyValue)) {
//                 observerdKeyValue = TokenContext(undefined, tokenContext.location, tokenContext.from);
//             }
//
//             logicContext.set(RuleContext(Scope(ruleContext.scope('artifact')), expectedKeyRuleDefinition, observerdKeyValue));
//         }));
//     });
//
//     rule.addLogicDefinition(LogicDefinition(`defineAllowedKeys`, function onRun(tokenContext) {
//         const logicContext = this;
//         const ruleContext = logicContext.ruleContext;
//
//         ruleContext.scope.
//         ruleContext.scope('rule').scope('keys').set(ruleContext, allowedKeyNames);
//     }), function onPause() {
//         ruleContext.scope('rule').scope('keys').remove(ruleContext);
//     });
// }

function objectDefinition() {

    // const objLogicDef = LogicDefinition('object', function objectLogicOnRun(tokenContext) {
    //     const logicContext = this;
    //
    //     const value = tokenContext.contents;
    //
    //     if (!_.isNil(value) && !_.isPlainObject(value)) {
    //         logicContext.set(Issue('schema', tokenContext.from, tokenContext.location, 'When defined this field must be a plain object', 'error')));
    //     } else {
    //         logicContext.set(null);
    //     }
    // });

    // const allowedKeysLogicDef = LogicDefinition('allowedKeys', function allowedKeysLogic(tokenContext) {
    //     const logicContext = this;
    //     const ruleContext = logicContext.ruleContext;
    //
    //     const value = tokenContext.contents;
    //
    //     const keysScope = ruleContext.scope('rule').scope('keys');
    //
    //     let execute;
    //
    //     keysScope.on('update', () => {
    //         execute();
    //     });
    //
    //     execute = () => {
    //         let allowedKeys;
    //
    //         keysScope.forEach((keys) => {
    //             if (_.isNil(allowedKeys)) {
    //                 allowedKeys = [];
    //             }
    //
    //             _.forEach(keys, (key) => {
    //                 allowedKeys.push(key);
    //             });
    //         }));
    //
    //         const issues = [];
    //
    //         _.forOwn(value, (childTokenContext, observedKey) => {
    //             const index = _.findIndex(allowedKeys, (expectedKey) => {
    //                 if (_.isRegExp(expectedKey)) {
    //                     return expectedKey.test(observedKey);
    //                 } else {
    //                     return expectedKey === observedKey;
    //                 }
    //             });
    //
    //             if (index >= 0) {
    //                 issues.push(Issue('schema', childTokenContext.from, childTokenContext.location, 'This property is not allowed to exist.', 'error')));
    //             }
    //         });
    //
    //         logicContext.set(issues);
    //     };
    // });

    const objectActions = {
        //keys: keysAction
    };

    const logicDefinition = LogicDefinition((runContext, value) => {
        if (!_.isNil(value) && !_.isPlainObject(value)) {
            runContext.raise('schema', 'When defined this field must be a plain object', 'error');
        } else {
            runContext.clear();
        }
    });

    const rule = Rule(logicDefinition, objectActions);

    // rule.addLogicDefinition(objLogicDef);
    // rule.addLogicDefinition(allowedKeysLogicDef);

    return rule;
}

module.exports = objectDefinition;
