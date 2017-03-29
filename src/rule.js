const _ = require('lodash');
const LogicDefinition = require('./logicDefinition');
const ShortId = require('shortid');

function addActions(actions) {
    _.forEach(actions, (action, actionName) => {
        this[actionName] = action.bind(null, this, actions);
    });
}

function Rule(logicDefinition, actions, parentRule) {
    if (!(this instanceof Rule)) {
        return new Rule(logicDefinition, actions, parentRule);
    }

    if (!(logicDefinition instanceof LogicDefinition)) {
        throw new Error('LogicDefinition required.');
    }

    addActions.call(this, actions);
    this.logicDefinition = logicDefinition;
    this.parentRule = parentRule;
    this.id = ShortId.generate();
}

Rule.prototype.applyLogic = function applyLogic(ruleContext) {
    let previousContext = null;

    if (!_.isNil(this.parentRule)) {
        previousContext = this.parentRule.applyLogic(ruleContext);
    }

    const logicContext = this.logicDefinition.buildContext(ruleContext, previousContext);

    ruleContext.addLogicContext(logicContext);

    return logicContext;
};

module.exports = Rule;
