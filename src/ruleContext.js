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

    return this.compacted;
};

RuleContext.prototype.raise = function raise(runId, type, message, severity) {
    this.compacted = null;

    this.livingIssues[runId] = Issue(type, this.tokenContext.from, this.tokenContext.location, message, severity);

    // if (issue instanceof RuleContext) {
    //     issue.on('update', () => {
    //         this.emitUpdate();
    //     });
    // }

    this.emitUpdate();
}

RuleContext.prototype.clear = function clear(runId) {
    this.compacted = null;

    delete this.livingIssues[runId];

    // if (issue instanceof RuleContext) {
    //     issue.on('update', () => {
    //         this.emitUpdate();
    //     });
    // }

    this.emitUpdate();
}

RuleContext.prototype.update = function update(tokenContext) {
    this.livingIssues = {};
    this.compacted = null;
    this.tokenContext = tokenContext;

    // const runContext = this.rule.logicDefinition.createRunContext(this.scope, tokenContext);

    this.rule.build(this);

    this.emit('start');

    // this.ruleControl.start();
    // if (this.isEnabled) {
    //     this.ruleControl.start();
    // }
};
//
// RuleContext.prototype.set = function set(issueId, issue) {
//     this.compacted = null;
//
//     this.livingIssues[issueId] = issue;
//
//     if (issue instanceof RuleContext) {
//         issue.on('update', () => {
//             this.emitUpdate();
//         });
//     }
//
//     this.emitUpdate();
// };

RuleContext.prototype.emitUpdate = _.debounce(function emitUpdate() {
    this.emit('update', this.issues());
}, 50, {
    maxWait: 100
});

module.exports = RuleContext;
