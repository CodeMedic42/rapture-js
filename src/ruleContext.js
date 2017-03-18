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

function RuleContext(rule, scope, tokenContext) {
    if (!(this instanceof RuleContext)) {
        return new RuleContext(rule, scope, tokenContext);
    }

    if (_.isNil(tokenContext)) {
        throw new Error('Must provide a tokenContext');
    }

    this.scope = Scope('__rule', scope);
    this.rule = rule;
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
        current.push(...child.issues());

        return current;
    }, []);

    finalIssues.unshift(...this.compacted);

    return finalIssues;
};

function _raise(runId, issueMeta) {
    const targetFrom = _.isNil(issueMeta.from) ? this.tokenContext.from : issueMeta.from;
    const targetLocation = _.isNil(issueMeta.location) ? this.tokenContext.location : issueMeta.location;

    this.livingIssues[runId] = Issue(issueMeta.type, targetFrom, targetLocation, issueMeta.message, issueMeta.severity);
}

RuleContext.prototype.raise = function raise(runId, ...issueMeta) {
    this.compacted = null;

    if (_.isArray(issueMeta[0])) {
        _.forEach(issueMeta[0], (issueMetaItem) => {
            _raise.call(this, runId, issueMetaItem);
        });
    } else if (_.isPlainObject(issueMeta[0])) {
        _raise.call(this, runId, issueMeta);
    } else {
        _raise.call(this, runId, { type: issueMeta[0], message: issueMeta[1], severity: issueMeta[2], from: issueMeta[3], location: issueMeta[4] });
    }

    run.call(this);
};

RuleContext.prototype.clear = function clear(runId) {
    this.compacted = null;

    delete this.livingIssues[runId];

    run.call(this);
};

RuleContext.prototype.buildContext = function buildContext(rule, tokenContext) {
    const ruleContext = rule.buildContext(this.scope, tokenContext);

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
    this.runStatus = 'starting';

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.start();
    });

    run.call(this, true);

    this.runStatus = 'started';
};

RuleContext.prototype.stop = function stop() {
    this.runStatus = 'stopping';

    _.foreach(this.logicContexts, (logicContext) => {
        logicContext.stop();
    });

    run.call(this, true);

    this.runStatus = 'stopped';
};

module.exports = RuleContext;
