const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const Console = require('console');
const Scope = require('./scope.js');

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
        this.emit('raise', this.issues);

        return;
    }

    this.status = 'emitNeeded';
}

function RuleContext(runContext, rule) {
    if (!(this instanceof RuleContext)) {
        return new RuleContext(runContext, rule);
    }

    if (!_.isUndefined(rule.ruleGroup.scopeId)) {
        this.scope = Scope(rule.ruleGroup.scopeId, runContext.scope);
        this.ScopeOwner = true;
    } else {
        this.scope = runContext.scope;
        this.ScopeOwner = false;
    }

    this.logicContexts = [];
    this.compacted = [];
    this.tokenValue = runContext.tokenValue;
    this.status = 'stopped';
    this.rule = rule;
    this.runContext = runContext;
    this.data = runContext.data;

    rule.applyLogic(this);

    EventEmitter.call(this);
}

Util.inherits(RuleContext, EventEmitter);

RuleContext.prototype.issues = function issues() {
    return this.compacted;
};

function onUpdate() {
    const issues = _.reduce(this.logicContexts, (current, context) => {
        current.push(...context.issues());

        return current;
    }, []);

    if (issues.length === 0 && this.compacted.length === 0) {
        // raise nothing
        return;
    }

    this.compacted = issues;

    emitRaise.call(this);
}

RuleContext.prototype.addLogicContext = function addLogicContext(logicContext) {
    checkDisposed.call(this);

    this.logicContexts.push(logicContext);

    logicContext.on('update', onUpdate, this);
};

RuleContext.prototype.start = function start() {
    checkDisposed.call(this);

    if (this.status === 'started' || this.status === 'starting') {
        return;
    }

    this.status = 'starting';

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.start();
    });

    if (this.status === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.status = 'started';
};

RuleContext.prototype.stop = function stop() {
    if (this.status === 'stopped' || this.status === 'stopping' || this.status === 'disposed') {
        return;
    }

    this.status = 'stopping';

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.stop();
    });

    if (this.status === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.status = 'stopped';
};

RuleContext.prototype.updateTokenValue = function updateTokenValue(newTokenValue) {
    checkDisposed.call(this);

    const oldStatus = this.status;

    this.status = 'updating';

    this.tokenValue = newTokenValue;

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.dispose();
    });

    this.logicContexts = [];

    this.rule.applyLogic(this);

    if (oldStatus === 'started') {
        _.forEach(this.logicContexts, (logicContext) => {
            logicContext.start();
        });
    }

    if (this.status === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.status = oldStatus;
};

RuleContext.prototype.dispose = function dispose() {
    checkDisposed.call(this, true);

    this.runStatus = 'disposing';

    _.forEach(this.logicContexts, (logicContext) => {
        logicContext.dispose();
    });

    if (this.ScopeOwner) {
        this.scope.dispose();
        this.scope = null;
    }

    this.logicContexts = null;

    this.status = 'disposed';

    this.emit('disposed');
};

module.exports = RuleContext;
