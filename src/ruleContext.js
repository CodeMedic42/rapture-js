const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const Issue = require('./issue.js');
const Scope = require('./scope.js');

function RuleContext(rule, scope, tokenContext) {
    if (!(this instanceof RuleContext)) {
        return new RuleContext(rule, scope, tokenContext);
    }

    if (_.isNil(tokenContext)) {
        throw new Error('Must provide a tokenContext');
    }

    this.scope = scope;
    this.rule = rule;
    this.children = [];

    RuleContext.prototype.update.call(this, tokenContext);

    EventEmitter.call(this);
}

Util.inherits(RuleContext, EventEmitter);

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

    const finalIssues = _.reduce(this.children, (current, child) => {
        current.push(...child.issues);

        return current;
    }, []);

    finalIssues.unshift(...this.compacted);

    return finalIssues;
};

RuleContext.prototype.raise = function raise(runId, type, message, severity, from, location) {
    this.compacted = null;

    let targetFrom = _.isNil(from) ? this.tokenContext.from : from;
    let targetLocation = _.isNil(location) ? this.tokenContext.location : location;

    this.livingIssues[runId] = Issue(type, targetFrom, targetLocation, message, severity);

    this.emitUpdate();
}

RuleContext.prototype.clear = function clear(runId) {
    this.compacted = null;

    delete this.livingIssues[runId];

    this.emitUpdate();
}

RuleContext.prototype.link = function link(ruleContext) {
    this.children.push(ruleContext);

    ruleContext.on('update', () => {
        this.emitUpdate();
    });

    this.emitUpdate();
}

RuleContext.prototype.update = function update(tokenContext) {
    this.livingIssues = {};
    this.compacted = null;
    this.tokenContext = tokenContext;

    this.rule.build(this);

    this.emit('start');
};

RuleContext.prototype.emitUpdate = _.debounce(function emitUpdate() {
    this.emit('update', this.issues());
}, 50, {
    maxWait: 100
});

RuleContext.prototype.destroy = function destroy() {
    this.emit('destroy');
};

module.exports = RuleContext;
