const _ = require('lodash');
const LogicDefinition = require('./logicDefinition');
const RuleContext = require('./ruleContext');

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
}

function _buildContext(ruleContext) {
    if (!_.isNil(this.parentRule)) {
        _buildContext.call(this.parentRule, ruleContext);
    }

    const logicContext = this.logicDefinition.buildContext(ruleContext);

    ruleContext.addLogicContext(logicContext);
}

Rule.prototype.buildContext = function buildContext(initalRuleScope, tokenContext) {
    const ruleContext = RuleContext(this, initalRuleScope, tokenContext);

    _buildContext.call(this, ruleContext);

    return ruleContext;
};

module.exports = Rule;
