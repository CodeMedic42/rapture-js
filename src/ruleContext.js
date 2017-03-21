const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const Issue = require('./issue.js');
const Scope = require('./scope.js');

function run(force) {
    if (this.runStatus === 'started' || force) {
        this.emit('update', this.issues());
    }
}

function RuleContext(scope, tokenContext) {
    if (!(this instanceof RuleContext)) {
        return new RuleContext(scope, tokenContext);
    }

    if (_.isNil(tokenContext)) {
        throw new Error('Must provide a tokenContext');
    }

    this.scope = Scope('__rule', scope);
    this.children = [];
    this.logicContexts = [];
    this.livingIssues = {};
    this.compacted = null;
    this.tokenContext = tokenContext;
    this.runStatus = 'stopped';

    EventEmitter.call(this);
}

Util.inherits(RuleContext, EventEmitter);

RuleContext.prototype.issues = function issues() {
    if (_.isNil(this.compacted)) {
        this.compacted = _.reduce(this.livingIssues, (current, iss) => {
            _.forEach(iss, (issue) => {
                current.push(issue);
            });

            return current;
        }, []);
    }

    const finalIssues = _.reduce(this.children, (current, child) => {
        current.push(...child.issues());

        return current;
    }, []);

    finalIssues.unshift(...this.compacted);

    return finalIssues;
};

function cleanIssue(tokenContext, issueMeta) {
    const targetFrom = _.isNil(issueMeta.from) ? tokenContext.from : issueMeta.from;
    const targetLocation = _.isNil(issueMeta.location) ? tokenContext.location : issueMeta.location;

    return Issue(issueMeta.type, targetFrom, targetLocation, issueMeta.message, issueMeta.severity);
}

RuleContext.prototype.raise = function raise(runId, ...issueMeta) {
    this.compacted = null;
    let target = null;

    if (_.isArray(issueMeta[0])) {
        target = issueMeta[0];
    } else if (_.isPlainObject(issueMeta[0])) {
        target = [issueMeta[0]];
    } else if (!_.isNil(issueMeta[0]) && _.isString(issueMeta[0])) {
        target = [{ type: issueMeta[0], message: issueMeta[1], severity: issueMeta[2], from: issueMeta[3], location: issueMeta[4] }];
    } else {
        throw new Error('Unknown Issue');
    }

    if (target.length <= 0) {
        return;
    }

    this.livingIssues[runId] = _.reduce(target, (current, issue) => {
        current.push(cleanIssue(this.tokenContext, issue));

        return current;
    }, []);

    run.call(this);
};

RuleContext.prototype.clear = function clear(runId) {
    this.compacted = null;

    delete this.livingIssues[runId];

    run.call(this);
};

RuleContext.prototype.buildContext = function buildContext(rule, tokenContext, copy) {
    if (copy) {
        const duplicate = RuleContext(null, this.tokenContext);

        duplicate.scope = this.scope;
        rule.addToContext(duplicate);
        this.children.push(duplicate);

        return duplicate;
    }

    const ruleContext = rule.buildContext(this.scope.parentScope, tokenContext);

    this.children.push(ruleContext);

    ruleContext.on('update', () => {
        run.call(this);
    });

    return ruleContext;
};

RuleContext.prototype.destroy = function destroy() {
    this.emit('destroy');
};

RuleContext.prototype.addLogicContext = function addLogicContext(logicContext) {
    this.logicContexts.push(logicContext);
};

RuleContext.prototype.start = function start() {
    if (this.runStatus === 'started' || this.runStatus === 'starting') {
        return;
    }

    this.runStatus = 'starting';

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.start();
    });

    run.call(this, true);

    this.runStatus = 'started';
};

RuleContext.prototype.stop = function stop() {
    if (this.runStatus === 'stopped' || this.runStatus === 'stopping') {
        return;
    }

    this.runStatus = 'stopping';

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.stop();
    });

    run.call(this, true);

    this.runStatus = 'stopped';
};

module.exports = RuleContext;
