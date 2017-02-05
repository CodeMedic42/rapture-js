const _ = require('lodash');
const Common = require('./common.js');
const Rule = require('../rule.js');
const Issue = require('../issue.js');
const LogicDefinition = require('../logicDefinition.js');

// function keys(continueWith, keys, severity) {
//     const sev = Common.validateSeverity(severity);
//
//     const allowedKeysParameter = this.getLogic('allowedKey').getParameter('allowedKeys');
//
//     _.forOwn(keys, (value, keyName) => {
//         allowedKeysParameter.push(keyName);
//
//         this.addLogic('onRun', LogicDefinition(`key_${keyName}`, function objectLogic(id, tokenContext) {
//             const value = tokenContext.contents;
//             let message = null;
//
//             this.set(id, null);
//         }));
//     });
//
//     return continueWith;
// }
//
// function min(continueWith, minVal, severity) {
//     this.removeLogic('length');
//
//     const sev = validateSeverity(severity);
//
//     this.addLogic('onRun', LogicDefinition('min', function minLogic(id, tokenContext) {
//         const value = tokenContext.contents;
//
//         if (_.isNil(value)) {
//             this.set(id, null);
//         } else {
//             if(_.keys(value).length >= minVal) {
//                 this.set(id, null);
//             } else {
//                 this.set(id, Issue('schema', tokenContext.from, tokenContext.location, `${minVal} or more properties must exist.`, sev));
//             }
//         }
//     }));
//
//     return continueWith;
// }
//
// function max(continueWith, maxVal, severity) {
//     this.removeLogic('length');
//
//     const sev = validateSeverity(severity);
//
//     this.addLogic('onRun', LogicDefinition('max', function maxLogic(id, tokenContext) {
//         const value = tokenContext.contents;
//
//         if (_.isNil(value)) {
//             this.set(id, null);
//         } else {
//             if(_.keys(value).length <= maxVal) {
//                 this.set(id, null);
//             } else {
//                 this.set(id, Issue('schema', tokenContext.from, tokenContext.location, `${maxVal} or less properties must exist.`, sev));
//             }
//         }
//     }));
//
//     return continueWith;
// }
//
// function length(continueWith, lengthVal, severity) {
//     this.removeLogic('min');
//     this.removeLogic('max');
//
//     const sev = validateSeverity(severity);
//
//     this.addLogic('onRun', LogicDefinition('length', function lengthLogic(id, tokenContext) {
//         const value = tokenContext.contents;
//
//         if (_.isNil(value)) {
//             this.set(id, null);
//         } else {
//             if(_.keys(value).length === lengthVal) {
//                 this.set(id, null);
//             } else {
//                 this.set(id, Issue('schema', tokenContext.from, tokenContext.location, `${lengthVal} properties must exist.`, sev));
//             }
//         }
//     }));
//
//     return continueWith;
// }

function _string(severity) {
    const sev = Common.validateSeverity(severity);

    const rule = Rule();

    const avaliableCommands = {};

    avaliableCommands.rule = Common.rule.bind(rule);
    avaliableCommands.required = Common.required.bind(rule, avaliableCommands);
    avaliableCommands.optional = Common.optional.bind(rule, avaliableCommands);
    avaliableCommands.register = Common.register.bind(rule, avaliableCommands);

    rule.addLogic('onRun', LogicDefinition('string', function objectLogic(id, tokenContext) {
        const value = tokenContext.contents;

        if (!_.isNil(value) && !_.isString(value)) {
            this.set(id, Issue('schema', tokenContext.from, tokenContext.location, 'When defined this field must be a plain object', sev));
        } else {
            this.set(id, null);
        }
    }));

    return avaliableCommands;
}

module.exports = _string;
