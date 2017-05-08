const _ = require('lodash');
const ShortId = require('shortid');
const Logic = require('./logic');

function addActions(actions) {
    _.forEach(actions, (action, actionName) => {
        this[actionName] = action.bind(null, this, actions);
    });
}

function Rule(name, logic, actions, parentRule) {
    if (!(this instanceof Rule)) {
        return new Rule(name, logic, actions, parentRule);
    }

    if (!_.isNil(logic) && !(logic instanceof Logic)) {
        throw new Error('Logic required.');
    }

    addActions.call(this, actions);
    this.logic = logic;

    this.name = name;
    this.id = ShortId.generate();

    if (_.isNil(parentRule)) {
        this.groupId = ShortId.generate();
    } else if (parentRule instanceof Rule) {
        this.parentRule = parentRule;
        this.groupId = this.parentRule.groupId;
    } else {
        throw new Error('If defined, parentRule must be a Rule object');
    }
}

Rule.prototype.applyLogic = function applyLogic(ruleContext) {
    let previousContext = null;

    if (!_.isNil(this.parentRule)) {
        previousContext = this.parentRule.applyLogic(ruleContext);
    }

    let logicContext = null;

    if (!_.isNil(this.logic)) {
        logicContext = this.logic.buildContext(this.name, ruleContext, previousContext);

        ruleContext.addLogicContext(logicContext);
    }

    return logicContext;
};

module.exports = Rule;
