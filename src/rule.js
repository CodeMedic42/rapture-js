const _ = require('lodash');
const LogicDefinition = require('./logicDefinition');

// function buildThen(thenLogic) {
//     if (!_.isFunction(thenLogic)) {
//         throw new Error('Must be a function');
//     }
//
//     const thenLogic = args[args.length - 1];
//
//     const rule = Rule();
//
//     thenLogic(rule);
// }
//
// function buildIs(isLogic, thenLogic) {
//     const isLast = isLogic[isLogic.length - 1];
//
//     if (!_.isFunction(isLast)) {
//         throw new Error('Not Implemented');
//     }
//
//     const parameters = _.slice(isLogic, 0, isLogic.length - 1);
//
//     return LogicDefinition(null, function ifLogicRun(tokenContext) {
//         const ruleContext = RuleContext(this.scope, thenLogic, tokenContext);
//
//         this.set(id, ruleContext);
//
//         WatchGroup(this.scope, parameters).on('updated', (args) => {
//             const ret = !!isLast.bind(null, callArgs);
//
//             ruleContext.enabled(ret);
//         })
//
//         // const callArgs = _.reduce(parameters, (current, param, index) => {
//         //     let aliasValue;
//         //
//         //     if (param === 'this') {
//         //         aliasValue = tokenContext.normalize();
//         //     } else {
//         //         aliasValue = this.scope('') getAlias(param);
//         //
//         //         this.watchAlias(param, (newValue) => {
//         //             current[index] = newValue;
//         //
//         //             execute();
//         //         });
//         //     }
//         //
//         //     current.push(alias);
//         //
//         //     return current;
//         // }, []);
//         //
//         // const execute = _.debounce(() => {
//         //     const ret = !!isLast.bind(null, callArgs);
//         //
//         //     ruleContext.enabled(ret);
//         // });
//         //
//         // execute();
//     }));
//
// }
//
// function buildConditionalLogic(...args) {
//     const then = buildThen(args[args.length - 1]);
//
//     return buildIs(_.slice(args, 0, args.length - 1), then);
// }
//
// function ifLogic(...args) {
//     const conditional = buildConditional(...args);
//
//     this.addLogicDefinition(conditional);
//
//     this.elseIf = (isEI, thenEI) => {
//         this.conditional.push({ isEI, thenEI });
//
//         return this;
//     };
//
//     this.else = (thenEI) => {
//         this.conditional.push({ true, thenEI });
//
//         delete this.elseIf;
//         delete this.else;
//
//         return this;
//     };
//
//     return this;
// };
//
// function register(id, level) {
//     this.register = { id, level };
//
//     return this;
// };

function addActions(actions) {
    _.forEach(actions, (action, actionName) => {
        this[actionName] = () => {
            action.logic.call(this);

            if (action.once) {
                delete this[actionName];
            }

            return this;
        }
    });
}

// function startContexts() {
//     _.forEach(this, (context) => {
//         context.start();
//     });
//
//     // Run the conditional logic
//
//     // Run the register if we can
// }
//
// function pauseContexts() {
//     _.forEach(this, (context) => {
//         context.pause();
//     });
//
//     // Undo conditional
//
//     // Un register
// }

function Rule(logicDefinition, actions, parentRule) {
    if (!(this instanceof Rule)) {
        return new Rule(logicDefinition, actions, parentRule);
    }

    if (!(logicDefinition instanceof LogicDefinition)) {
        throw new Error('LogicDefinition required.');
    }

    // this.logicDefinitions = [];

    addActions.call(this, actions);
    this.logicDefinition = logicDefinition;
    this.parentRule = parentRule;

    // this.register = register.bind(this);
    // this.if = ifLogic.bind(this);
}

// Rule.prototype.addLogicDefinition = function addLogicDefinition(logicDefinition) {
//     this.logicDefinitions.push(logicDefinition);
// };

// Rule.prototype.createContext = function createContext(scope, tokenContext) {
//
//
//     const ruleContext = RuleContext(this, scope, tokenContext);

    // const logicContexts = _.reduce(this.logicDefinitions, (recur, logic) => {
    //     recur.push(logic.createContext(ruleContext, tokenContext));
    //
    //     return recur;
    // }, []);
    //
    // ruleContext.
    //
    // return {
    //     start: startContexts.bind(logicContexts),
    //     pause: pauseContexts.bind(logicContexts)
    // };
// };

Rule.prototype.build = function build(ruleContext) {
    if (!_.isNil(this.parentRule)) {
        this.parentRule.build(ruleContext);
    }

    this.logicDefinition.createRunContext(ruleContext);
};


module.exports = Rule;
