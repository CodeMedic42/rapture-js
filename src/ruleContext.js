const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const Scope = require('scope.js');

function RuleContext(sessionScope, sessionContextScope, ruleScope, ruleDefinition, tokenContext, enabled) {
    if (!(this instanceof RuleContext)) {
        return new RuleContext(sessionScope, sessionContextScope, ruleScope, ruleDefinition, tokenContext, enabled);
    }

    this.sessionScope = sessionScope;
    this.sessionContextScope = sessionContextScope;
    this.ruleScope = ruleScope || Scope();
    this.rule = ruleDefinition.rule();
    this.enabled = !!enabled;

    RuleContext.prototype.update.call(this, tokenContext);

    EventEmitter.call(this);
}

Util.inherits(RuleContext, EventEmitter);

RuleContext.prototype.enabled = function enabled(enable) {
    const old = this.isEnabled;

    this.isEnabled = !!enable;

    if (this.isEnabled === old) {
        return;
    }

    if (this.isEnabled) {
        this.ruleControl.start();
    } else {
        this.ruleControl.pause();
    }
}

RuleContext.prototype.issues = function issues() {
    if (_.isNil(this.compacted)) {
        this.compacted = _.reduce(this.livingIssues, (current, issue) => {
            if (!_.isNil(issue)) {
                if (issue instanceof RuleContext) {
                    current.push(...issue.issues());
                } else {
                    current.push(issue);
                }
            }

            return current;
        }, []);
    }

    return this.compacted;
};

RuleContext.prototype.update = function update(tokenContext) {
    this.livingIssues = {};
    this.compacted = null;

    this.tokenContext = tokenContext;

    this.ruleControl = this.rule.init(this, this.tokenContext);

    if (this.isEnabled) {
        this.ruleControl.start();
    }
};

RuleContext.prototype.set = function set(issueId, issue) {
    this.compacted = null;

    this.livingIssues[issueId] = issue;

    if (issue instanceof RuleContext) {
        issue.on('update', () => {
            this.emitUpdate();
        });
    }

    this.emitUpdate();
};

RuleContext.prototype.emitUpdate = _.debounce(function emitUpdate() {
    this.emit('update', this.issues());
}, 50, {
    maxWait: 100
});

module.exports = RuleContext;
