const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const ShortId = require('shortid');
const Issue = require('./issue');
const Common = require('./common.js');
const Scope = require('./scope.js');

function calculateFault() {
    const fault = this._status.valueStatus !== 'ready' || (_.isNil(this._previousLogicContext) ? false : this._previousLogicContext.faulted());

    if (this._status.faultStatus !== fault) {
        this._status.faultStatus = fault;
        this._context.isFaulted = fault;

        this._status.faultRequired = true;
    }
}

function runEmits(force) {
    if (!force && (this._status.processing || this._status.runStatus !== 'started')) {
        return;
    }

    if (this._status.raiseRequired) {
        this.emit('raise');

        this._status.raiseRequired = false;
    }

    if (this._status.updateRequired) {
        this._status.updateRequired = false;

        this.emit('update', this._status.valueStatus, this._currentValue);
    }

    if (this._status.faultRequired) {
        this._status.faultRequired = false;

        this.emit('fault', this._status.faultStatus);
    }
}

function raise(...issueMeta) {
    let target;

    if (_.isNil(issueMeta[0])) {
        target = null;
    } else if (_.isArray(issueMeta[0])) {
        target = issueMeta[0];
    } else if (_.isPlainObject(issueMeta[0])) {
        target = [issueMeta[0]];
    } else if (!_.isNil(issueMeta[0]) && _.isString(issueMeta[0])) {
        target = [{ type: issueMeta[0], message: issueMeta[1], severity: issueMeta[2], from: issueMeta[3], location: issueMeta[4] }];
    }

    const newIssues = _.reduce(target, (current, issue) => {
        current.push(Issue(issue.type, issue.from, issue.location, issue.message, issue.severity));

        return current;
    }, []);

    // If both are empty then don't emit anything. It just creates noise.
    if (newIssues.length === 0 && this._livingIssues.length === 0) {
        return;
    }

    this._livingIssues = newIssues;

    this._status.raiseRequired = true;

    const newValueStatus = this._livingIssues.length > 0 ? 'failed' : 'ready';

    if (this._status.valueStatus !== newValueStatus) {
        this._status.valueStatus = newValueStatus;

        this._status.updateRequired = true;
    }

    calculateFault.call(this);

    runEmits.call(this);
}

function checkParameters(parameters) {
    let ready = true;
    const issues = [];

    _.forOwn(parameters.meta, (meta, name) => {
        const paramStatus = meta.status;

        if (meta.required) {
            if (paramStatus === 'undefined') {
                // The required value has never been defined and this is an issue.
                issues.push(Issue('rule', null, null, `Required rule value "${name}" is not defined.`, 'warning'));

                ready = false;
            } else if (paramStatus === 'failed') {
                // The required value has been defined but it's validation is failing.
                // The validation should be generating an issue for it so no need to create a new one.
                // This still marks us as not ready to run.
                ready = false;
            } else if (paramStatus === 'ready') {
                // Everything is good here
            } else {
                throw new Error('Should never get here.');
            }

            return;
        }

        if (paramStatus === 'undefined') {
            // Then for some reason the definition is not ready yet.
            // We can no idea why so we are not going to do anything here.
            ready = false;
        } else if (paramStatus === 'failed') {
            // There is a context with issues here.
            issues.push(...parameters.contexts[name].issues());

            ready = false;
        } else if (paramStatus === 'ready') {
            // Everything is good here
        } else {
            throw new Error('Should never get here.');
        }
    });

    return { ready, issues };
}

function _run() {
    this._status.processing = true;

    const paramResult = checkParameters(this._parameters);

    if (!paramResult.ready) {
        this._context.isFailed = true;

        if (this._options.runOnFailure && !_.isNil(this._onRun)) {
            // TODO: need to restrict onRun as this is a failure state.
            // TODO: No raise is allowed here.
            this._onRun(this._context, this._content, this._parameters.values);
        }

        // This is hear because we want to set the issues after run is called
        this._context.raise(paramResult.issues);

        this._status.valueStatus = 'failed';
    } else {
        this._context.isFailed = false;

        this._context.raise();

        // Current value could have been set by setup.
        // So even if onRun does not exists we will still want to emit the value when we start up..
        if (!_.isNil(this._onRun)) {
            this._onRun(this._context, this._content, this._parameters.values);
        }
    }

    this._status.processing = false;

    runEmits.call(this);
}

function _set(value) {
    if (value === this._currentValue) {
        return false; // Did not result in an update
    }

    this._currentValue = value;

    this._status.updateRequired = true;

    runEmits.call(this);

    return true; // Did result in an update
}

function createRuleContextInScope(scopeId, rule) {
    const ruleContext = this._ruleContext;

    const newScope = Scope(scopeId, this._ruleContext.scope);

    const newRuleContext = ruleContext.createRuleContext(rule, newScope);

    newRuleContext.on('disposed', () => {
        newScope.dispose();
    });

    return newRuleContext;
}

function createRuleContext(rule, tokenContext) {
    if (_.isNil(tokenContext)) {
        const ruleContext = this._ruleContext;

        return ruleContext.createRuleContext(rule, this._ruleContext.scope);
    }

    const runContext = require('./runContext.js')(); // eslint-disable-line

    tokenContext.addRunContext(runContext);

    return runContext.createRuleContext(rule, this._ruleContext.scope);
}

function buildLogicContext(logicDefinition) {
    return logicDefinition.buildContext(`${this._id}`, this._ruleContext);
}

function register(targetScope, id, value, _status, force) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = this._ruleContext.scope.id;
    }

    this._ruleContext.scope.set(_targetScope, id, value, _status, this, force);
}

function unregister(targetScope, id) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = this._ruleContext.scope.id;
    }

    this._ruleContext.scope.remove(_targetScope, id, this);
}

function buildContext() {
    this._context = {
        raise: raise.bind(this),
        data: this._ruleContext.data,
        id: this._id,
        createRuleContext: createRuleContext.bind(this),
        createRuleContextInScope: createRuleContextInScope.bind(this),
        buildLogicContext: buildLogicContext.bind(this),
        register: register.bind(this),
        unregister: unregister.bind(this),
        scope: this._ruleContext.scope,
        set: _set.bind(this)
    };
}

function onParameterUpdate(name, status, value) {
    this._parameters.meta[name].status = status;

    if (status === 'ready') {
        this._parameters.values[name] = value;
    } else {
        delete this._parameters.values[name];
    }

    if (this._status.runStatus === 'started') {
        _run.call(this);
    }
}

function processDefinition(param, name) {
    const Logic = require('./logic'); // eslint-disable-line

    this._parameters.meta[name] = {
        required: false
    };

    if (param.value instanceof Logic) {
        const logicContext = param.value.buildContext(this._id, this._ruleContext);

        this._parameters.meta[name].status = logicContext.status();

        if (this._parameters.meta[name].status === 'ready') {
            this._parameters.values[name] = logicContext.currentValue;
        }

        this._parameters.listeners[name] = Common.createListener(logicContext, 'update', null, onParameterUpdate.bind(this, name));
        this._parameters.contexts[name] = logicContext;
    } else {
        this._parameters.values[name] = param.value;
        this._parameters.meta[name].status = 'ready';
    }
}

function stopWatch(name) {
    if (!_.isNil(this._parameters.listeners[name])) {
        // Stop the old watch
        this._parameters.listeners[name]();
        delete this._parameters.listeners[name];
    }
}

function processRequired(param, name) {
    const Logic = require('./logic'); // eslint-disable-line

    this._parameters.meta[name] = {
        required: true,
        status: 'undefined',
        watchId: null
    };

    if (param.value instanceof Logic) {
        const logicContext = param.value.buildContext(this._id, this._ruleContext);

        logicContext.on('update', (status, value) => {
            if (status !== 'ready') {
                // kill the watch
                this._parameters.meta[name].watchId = null;

                stopWatch.call(this, name);

                return;
            } else if (value === this._parameters.meta[name].watchId) {
                // Id did not change so no need to reload the watch
                return;
            }

            stopWatch.call(this, name);

            this._parameters.meta[name].watchId = value;

            this._parameters.listeners[name] = this._ruleContext.scope.watch(value, onParameterUpdate.bind(this, name));
        });

        this._parameters.contexts[name] = logicContext;
    } else {
        const listener = this._ruleContext.scope.watch(param.value, onParameterUpdate.bind(this, name));

        this._parameters.listeners[name] = listener;
        this._parameters.meta[name].watchId = param.value;
    }
}

function processParameters(parameters) {
    this._parameters = {
        values: {},
        meta: {},
        contexts: {},
        listeners: {}
    };

    const Logic = require('./logic'); // eslint-disable-line

    _.forOwn(parameters, (param, name) => {
        if (param.required) {
            processRequired.call(this, param, name);
        } else {
            processDefinition.call(this, param, name);
        }
    });

    this.disposables.push(() => {
        _.forOwn(this._parameters.listeners, (listener) => {
            if (!_.isNil(listener)) {
                listener();
            }
        });
    });
}

function onFault() {
    calculateFault.call(this);

    // Only manipulate the run state if allowed.
    if (this._options.onFaultChange && this._status.faultRequired) {
        _run.call(this);
    }

    this.emit('fault', this._status.faultStatus);
}

function LogicContext(name, ruleContext, onSetup, onRun, onPause, onTeardown, parameters, previousLogicContext, options) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(name, ruleContext, onSetup, onRun, onPause, onTeardown, parameters, previousLogicContext, options);
    }

    EventEmitter.call(this);

    this.disposables = [];

    this._ruleContext = ruleContext;

    this._id = `${name}-${ShortId.generate()}`;

    const defaultOptions = {
        onFaultChange: false
    };

    this._options = _.isNil(options) ? defaultOptions : options;

    if (this._options.useToken) {
        this._content = this._ruleContext.tokenContext;
    } else {
        this._content = this._ruleContext.tokenContext.getRaw();
    }

    this._status = {
        runStatus: 'stopped',
        valueStatus: 'ready',
        lastEmited: null
    };

    this._livingIssues = [];

    this._onRun = onRun;
    this._onPause = onPause;
    this._onTeardown = onTeardown;
    this._currentValue = undefined;

    processParameters.call(this, parameters);

    buildContext.call(this);

    if (!_.isNil(previousLogicContext)) {
        this._previousLogicContext = previousLogicContext;

        this.disposables.push(Common.createListener(previousLogicContext, 'fault', this, onFault, () => {
            this._previousLogicContext = null;
        }));
    }

    if (!_.isNil(onSetup)) {
        this._currentValue = onSetup(this._context, this._content);
    }

    if (_.isNil(this._onRun)) {
        if (parameters.length > 0) {
            throw new Error('onRun was not defined even though define and/or required where called.');
        }
    }
}

Util.inherits(LogicContext, EventEmitter);

LogicContext.prototype.faulted = function faulted() {
    Common.checkDisposed(this);

    let previousFault = false;

    if (!_.isNil(this._previousLogicContext)) {
        previousFault = this._previousLogicContext.faulted();
    }

    return previousFault || (this._status.valueStatus !== 'ready');
};

LogicContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    return this._livingIssues;
};

LogicContext.prototype.start = function start() {
    Common.checkDisposed(this);

    // If we are already starting or are started then we should not do anything.
    if (this._status.runStatus === 'started' || this._status.runStatus === 'starting') {
        return;
    }

    this._status.runStatus = 'starting';

    this._context.isFaulted = !_.isNil(this._previousLogicContext) && this._previousLogicContext.faulted();

    _.forOwn(this._parameters.contexts, (context) => {
        context.start();
    });

    _run.call(this);

    runEmits.call(this, true);

    this._status.runStatus = 'started';
};

LogicContext.prototype.stop = function stop() {
    // Fail because we are already disposed.
    Common.checkDisposed(this);

    // If we are already stopping or are stopped then we should not do anything.
    if (this._status.runStatus === 'stopped' || this._status.runStatus === 'stopping') {
        return;
    }

    this._status.runStatus = 'stopping';

    // updateValueStatus.call(this, 'undefined');

    _.forOwn(this._parameters.contexts, (context) => {
        context.stop();
    });

    if (!_.isNil(this._onPause)) {
        this._onPause(this._context, this._content, this._currentValue);
    }

    this._context.raise();

    this._status.updateRequired = true;
    this._status.valueStatus = 'undefined';

    runEmits.call(this, true);

    this._status.runStatus = 'stopped';
};

LogicContext.prototype.status = function status() {
    Common.checkDisposed(this);

    return this._status.valueStatus;
};

LogicContext.prototype.dispose = function dispose() {
    // Warn the user that disposed has already been called.
    Common.checkDisposed(this, true);

    // If we are already disposed or are disposing then we should not do anything.
    if (this._status.runStatus === 'disposed' || this._status.runStatus === 'disposing') {
        return { commit: () => {} };
    }

    this._status.runStatus = 'disposing';

    _.forEach(this.disposables, (listener) => {
        listener();
    });

    const commits = [];

    _.forOwn(this._parameters.contexts, (context) => {
        commits.push(context.dispose().commit);
    });

    return {
        commit: () => {
            _.forEach(commits, (commit) => {
                commit();
            });

            if (!_.isNil(this._onTeardown)) {
                this._onTeardown(this._context, this._content, this._currentValue);
            }

            this._context.raise();

            this._status.updateRequired = true;
            this._status.valueStatus = 'undefined';

            runEmits.call(this, true);

            this._status.runStatus = 'disposed';
        }
    };
};

module.exports = LogicContext;
