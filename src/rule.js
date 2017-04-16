const _ = require('lodash');
const ShortId = require('shortid');
const Logic = require('./logic');
const RuleGroup = require('./ruleGroup.js');

function addActions(actions) {
    _.forEach(actions, (action, actionName) => {
        this[actionName] = action.bind(null, this, actions);
    });
}

function Rule(name, logic, actions, parentRule) {
    if (!(this instanceof Rule)) {
        return new Rule(name, logic, actions, parentRule);
    }

    if (!(logic instanceof Logic)) {
        throw new Error('Logic required.');
    }

    addActions.call(this, actions);
    this.logic = logic;
    this.parentRule = parentRule;
    this.name = name;
    this.id = ShortId.generate();
    this.ruleGroup = _.isNil(parentRule) ? RuleGroup() : parentRule.ruleGroup;
}

Rule.prototype.applyLogic = function applyLogic(ruleContext) {
    let previousContext = null;

    if (!_.isNil(this.parentRule)) {
        previousContext = this.parentRule.applyLogic(ruleContext);
    }

    const logicContext = this.logic.buildContext(ruleContext, previousContext);

    ruleContext.addLogicContext(logicContext);

    return logicContext;
};

module.exports = Rule;
