const _ = require('lodash');
const ShortId = require('shortid');
const RuleGroup = require('./ruleGroup.js');

function addActions(actions) {
    _.forEach(actions, (action, actionName) => {
        this[actionName] = action.bind(null, this, actions);
    });
}

function ScopeRule(actions, scopeId) {
    if (!(this instanceof ScopeRule)) {
        return new ScopeRule(actions, scopeId);
    }

    this.scopeId = _.isUndefined(scopeId) ? null : scopeId;
    addActions.call(this, actions);
    this.name = 'scope';
    this.id = ShortId.generate();
    this.ruleGroup = RuleGroup(this.scopeId);
}

ScopeRule.prototype.applyLogic = function applyLogic() {
    return null;
};

module.exports = ScopeRule;
