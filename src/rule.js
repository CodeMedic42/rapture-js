const _ = require('lodash');
const LogicDefinition = require('./logicDefinition');

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

Rule.prototype.build = function build(ruleContext) {
    if (!_.isNil(this.parentRule)) {
        this.parentRule.build(ruleContext);
    }

    const 

    const logicContext = this.logicDefinition.build(ruleContext);

    ruleContext.on('start', () => {
        logicContext.start();
    });

    ruleContext.on('stop', () => {
        logicContext.stop();
    });
};


module.exports = Rule;
