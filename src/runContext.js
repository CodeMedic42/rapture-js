const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const Console = require('console');
// const Scope = require('./scope.js');
const RuleContext = require('./ruleContext.js');

function checkDisposed(asWarning) {
    if (this.status === 'disposed') {
        const message = 'This object has been disposed.';

        if (asWarning) {
            Console.warn(message);
        } else {
            throw new Error(message);
        }
    }
}

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
    checkDisposed.call(this);

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
    checkDisposed.call(this);

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
    checkDisposed.call(this);

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
    checkDisposed.call(this, true);

    this.runStatus = 'disposing';

    _.forEach(this.ruleContexts, (context) => {
        context.dispose();
    });

    this.scope = null;
    this.livingIssues = null;
    this.compacted = null;
    this.tokenValue = undefined;
    this.status = 'disposed';
    this.ruleContexts = null;
    this.data = null;

    this.emit('disposed');
};

module.exports = RunContext;
