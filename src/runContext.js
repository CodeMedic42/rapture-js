const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const Common = require('./common.js');
// const Scope = require('./scope.js');
const RuleContext = require('./ruleContext.js');

function emitRaise(force) {
    if (this.status === 'started' || force) {
        this.emit('raise');

        return;
    }

    this.status = 'emitNeeded';
}

function RunContext(scope) {
    if (!(this instanceof RunContext)) {
        return new RunContext(scope);
    }

    this.scope = scope; // Scope('__rule', scope);
    this.livingIssues = {};
    this.compacted = null;
    this.tokenValue = undefined;
    this.status = 'stopped';
    this.ruleContexts = [];
    this.data = {};

    EventEmitter.call(this);
}

Util.inherits(RunContext, EventEmitter);

RunContext.prototype.runWith = function runWith(tokenValue) {
    Common.checkDisposed(this);

    this.status = 'updating';

    this.tokenValue = tokenValue;

    _.forEach(this.ruleContexts, (ruleContext) => {
        ruleContext.updateTokenValue(tokenValue);
    });

    if (this.status === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.status = 'started';
};

RunContext.prototype.createRuleContext = function createRuleContext(rule) {
    Common.checkDisposed(this);

    this.status = 'updating';

    const ruleContext = RuleContext(this, rule);

    ruleContext.on('raise', emitRaise, this);

    this.ruleContexts.push(ruleContext);

    if (this.status === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.status = 'started';

    return ruleContext;
};

RunContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    const finalIssues = [];

    _.forEach(this.ruleContexts, (ruleContext) => {
        finalIssues.push(...ruleContext.issues());
    });

    if (_.isNil(this.compactedIssues)) {
        this.compactedIssues = _.reduce(this.runContexts, (compactedIssues, runContext) => {
            _.forEach(runContext.issues(), (issue) => {
                const _issue = issue;

                _issue.location = this.location;
                _issue.from = this.form;

                compactedIssues.push(issue);
                finalIssues.push(issue);
            });

            return compactedIssues;
        }, []);
    } else {
        finalIssues.unshift(...this.compactedIssues);
    }

    return finalIssues;
};

RunContext.prototype.dispose = function dispose() {
    Common.checkDisposed(this, true);

    if (this.runStatus === 'disposed' || this.runStatus === 'disposing') {
        return { commit: () => {} };
    }

    this.runStatus = 'disposing';

    const commits = [];

    _.forEach(this.ruleContexts, (context) => {
        commits.push(context.dispose().commit);
    });

    return {
        commit: () => {
            _.forEach(commits, (commit) => {
                commit();
            });

            this.scope = null;
            this.livingIssues = null;
            this.compacted = null;
            this.tokenValue = undefined;
            this.status = 'disposed';
            this.ruleContexts = null;
            this.data = null;

            this.emit('disposed');
        }
    };
};

module.exports = RunContext;
