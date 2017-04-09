const ShortId = require('shortid');

function RuleGroup(scopeId) {
    if (!(this instanceof RuleGroup)) {
        return new RuleGroup(scopeId);
    }

    this.id = ShortId.generate();
    this.scopeId = scopeId;
}

module.exports = RuleGroup;
