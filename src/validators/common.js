const _ = require('lodash');
const Issue = require('../issue.js');
const LogicDefinition = require('../logicDefinition.js');
const Rule = require('../rule.js');
const RuleContext = require('../ruleContext.js');

function validateSeverity(severity) {
    if (_.isNil(severity)) {
        return 'error';
    }

    switch(severity) {
        case 'error':
        case 'warning':
        case 'information':
            return;

        default:
            throw Error('Invalid severity type');
    }
}

function required(continueWith, severity) {
    const sev = validateSeverity(severity);

    this.addLogic('onRun', LogicDefinition('required', function requiredLogic(id, tokenContext) {
        const value = tokenContext.contents;

        if (_.isNil(value)) {
            this.set(id, Issue('schema', tokenContext.from, tokenContext.location, 'A value is required', sev));
        } else {
            this.set(id, null);
        }
    }));

    return continueWith;
};

function optional(continueWith) {
    this.removeLogic('required');

    return continueWith;
};

function rule() {
    return this;
};

function register(continueWith, alias, global) {
    this.addLogic('onEnd', LogicDefinition('register', function registerLogic(id, tokenContext) {
        const value = tokenContext.normalize();

        try {
            this.sessionContext.setAlias(value, alias, global);
        } catch(err) {
            return this.set(id, Issue('schema', tokenContext.from, tokenContext.location, err.mesage, sev));
        }

        return this.set(id, null);
    }));

    return continueWith;
}

// function ifBuildLogic(continueWith, thenLogic) {
//     const rule = Rule();
//
//     thenLogic(rule);
//
//     return _.reduce(continueWith, (current, value, name) => {
//         current[name] = value.bind(rule, newContinueWith);
//
//         return current;
//     }, {});
// }


function elseIf(continueWith, is, then) {
    throw new Error('Not Implemented');
}

function else(continueWith, then) {
    throw new Error('Not Implemented');
}

// function evaluate(args, func, id, continueWith, tokenContext) {
//     const ret = !!func(...args);
//
//
//     const ruleContext = RuleContext(this.sessionContext, continueWith, tokenContext);
//
//     this.set(id, ruleContext);
//
//     if (ret) {
//         thenLogic(continueWith);
//     }
// }
//
// function if(continueWith, ...args) {
//     const thenLogic = args[args.length - 1];
//     const isLogic = _.slice(args, 0, args.length - 1);
//     const isLast = isLogic[isLogic.length - 1];
//     const ifContinueWith = ifContinue(continueWith, thenLogic);
//
//     if (_.isFunction(isLast)) {
//         const parameters = _.slice(isLogic, 0, isLogic.length - 1);
//
//         this.addLogic('onRun', LogicDefinition('if', function registerLogic(id, tokenContext) {
//             const callArgs = _.reduce(parameters, (current, param, index) => {
//                 let aliasValue;
//
//                 if (param === 'this') {
//                     aliasValue = tokenContext.normalize();
//                 } else {
//                     aliasValue = this.getAlias(param);
//
//                     this.watchAlias(param, (newValue) => {
//                         current[index] = newValue;
//
//                         execute();
//                     });
//                 }
//
//                 current.push(alias);
//
//                 return current;
//             }, []);
//
//             const execute = _.debounce(evaluate.bind(this, callArgs, isLast, 'id', ifContinueWith, tokenContext));
//
//             execute();
//         }));
//     } else if (islast.isJRule && isLogic.length === 1) {
//         throw new Error('Not Implemented');
//     } else {
//         throw new Error('The "is" component must be either end in a function or must be a single jRule definition.');
//     }
//
//     return ifContinue(continueWith, thenLogic);
// }

function if2(continueWith, ...args) {
    const thenLogic = args[args.length - 1];
    const isLogic = _.slice(args, 0, args.length - 1);
    const isLast = isLogic[isLogic.length - 1];

    const rule = Rule();

    thenLogic(rule);

    const ifContinueWith = _.reduce(continueWith, (current, value, name) => {
        current[name] = value.bind(rule, newContinueWith);

        return current;
    }, {});

    if (_.isFunction(isLast)) {
        const parameters = _.slice(isLogic, 0, isLogic.length - 1);

        this.addLogic('onRun', LogicDefinition('if', function registerLogic(id, tokenContext) {
            const ruleContext = RuleContext(this.sessionScope, this.sessionContextScope, this.ruleScope, ifContinueWith, tokenContext);

            ruleContext.ruleScope = this.ruleSCope

            this.set(id, ruleContext);

            const callArgs = _.reduce(parameters, (current, param, index) => {
                let aliasValue;

                if (param === 'this') {
                    aliasValue = tokenContext.normalize();
                } else {
                    aliasValue = this.getAlias(param);

                    this.watchAlias(param, (newValue) => {
                        current[index] = newValue;

                        execute();
                    });
                }

                current.push(alias);

                return current;
            }, []);

            const execute = _.debounce(() => {
                const ret = !!isLast.bind(null, callArgs);

                ruleContext.enabled(ret);
            });

            execute();
        }));
    } else if (islast.isJRule && isLogic.length === 1) {
        throw new Error('Not Implemented');
    } else {
        throw new Error('The "is" component must be either end in a function or must be a single jRule definition.');
    }

    return ifContinueWith;
}


module.exports = {
    required,
    optional,
    validateSeverity,
    rule,
    register
};
