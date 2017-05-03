const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const ShortId = require('shortid');
const Issue = require('./issue');
const Common = require('./common.js');
const Scope = require('./scope.js');

function updateValueStatus() {
    if (_.isNil(this._status.pendingValueStatus)) {
        // Nothing to do
        return;
    }

    const currentPendingValueStatus = this._status.pendingValueStatus;
    this._status.pendingValueStatus = null;

    if (this._status.valueStatus === currentPendingValueStatus) {
        // Nothing to do
        return;
    }

    this._status.valueStatus = currentPendingValueStatus;

    // HACK Fault change is getting chatty
    if (this._status.runStatus === 'started' || this._status.runStatus === 'starting') {
        const fault = this._status.valueStatus !== 'ready' || (_.isNil(this.previousContext) ? false : this.previousContext.faulted());

        this.emit('faultChange', fault);
    }
}

function emitUpdate(force) {
    updateValueStatus.call(this);

    if (this._status.runStatus === 'started' || force) {
        if ((this._status.lastEmited === this._status.valueStatus) && !this._status.emitRequired) {
            return;
        }

        this.lastEmited = this._status.valueStatus;
        this._status.emitRequired = false;
        this.emit('update', this._status.valueStatus, this.currentValue);
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

    if (!this._status.processing) {
        // If both are empty then don't emit anything. It just creates noise.
        if (newIssues.length === 0 && this.livingIssues.length === 0) {
            return;
        }

        if (newIssues.length > 0) {
            this._status.pendingValueStatus = 'failed';
            // updateValueStatus.call(this, 'failed');
        } else {
            this._status.pendingValueStatus = 'ready';
            // updateValueStatus.call(this, 'ready');
        }

        this._status.emitRequired = true;

        this.livingIssues = newIssues;

        emitUpdate.call(this);
    } else {
        this.livingIssues = newIssues;
    }
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
    this._status.pendingValueStatus = null;
    this._status.emitRequired = false;

    const paramResult = checkParameters(this.parameters);

    if (!paramResult.ready) {
        this.control.isFailed = true;

        this.control.raise(paramResult.issues);

        if (this.options.onFailure) {
            if (!_.isNil(this.onRun)) {
                this.currentValue = this.onRun(this.control, this.content, this.parameters.values, this.currentValue);
            }
        }

        this._status.pendingValueStatus = 'failed';
    } else {
        this.control.isFailed = false;

        this.control.raise();

        let ret = this.currentValue;

        // Current value could have been set by setup.
        // So even if onRun does not exists we will still want to emit the value when we start up..
        if (!_.isNil(this.onRun)) {
            ret = this.onRun(this.control, this.content, this.parameters.values, this.currentValue);
        }

        if (this.livingIssues.length <= 0) {
            // Even if ret and the current value match if we have never emitted it then we should.
            // if (ret === this.currentValue && this.lastEmited === 'ready') {
            //     return;
            // }

            if (ret !== this.currentValue) {
                this.currentValue = ret;
                this._status.emitRequired = true;
            }

            this._status.pendingValueStatus = 'ready';
        } else {
            this._status.pendingValueStatus = 'failed';
            // updateValueStatus.call(this, 'failed');
        }
    }

    this._status.processing = false;

    emitUpdate.call(this);
}

function createRuleContextInScope(scopeId, rule) {
    const ruleContext = this.ruleContext;

    const newScope = Scope(scopeId, this.ruleContext.scope);

    const newRuleContext = ruleContext.createRuleContext(rule, newScope);

    newRuleContext.on('disposed', () => {
        newScope.dispose();
    });

    return newRuleContext;
}

function createRuleContext(rule, tokenContext) {
    if (_.isNil(tokenContext)) {
        const ruleContext = this.ruleContext;

        return ruleContext.createRuleContext(rule, this.ruleContext.scope);
    }

    const runContext = require('./runContext.js')(); // eslint-disable-line

    tokenContext.addRunContext(runContext);

    return runContext.createRuleContext(rule, this.ruleContext.scope);
}

function buildLogicContext(logicDefinition) {
    return logicDefinition.buildContext(this.ruleContext);
}

function register(targetScope, id, value, _status) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = this.ruleContext.scope.id;
    }

    this.ruleContext.scope.set(_targetScope, id, value, _status, this);
}

function unregister(targetScope, id) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = this.ruleContext.scope.id;
    }

    this.ruleContext.scope.remove(_targetScope, id, this);
}

function buildControl() {
    return {
        raise: raise.bind(this),
        data: this.ruleContext.data,
        id: this.id,
        createRuleContext: createRuleContext.bind(this),
        createRuleContextInScope: createRuleContextInScope.bind(this),
        buildLogicContext: buildLogicContext.bind(this),
        register: register.bind(this),
        unregister: unregister.bind(this),
        scope: this.ruleContext.scope
    };
}

function onDefinedUpdate(name, status, value) {
    this.parameters.meta[name].status = status;

    if (status === 'ready') {
        this.parameters.values[name] = value;
    } else {
        delete this.parameters.values[name];
    }

    if (this._status.runStatus === 'started') {
        _run.call(this);
    }
}

function processDefinition(param, name) {
    const Logic = require('./logic'); // eslint-disable-line

    this.parameters.meta[name] = {
        required: false
    };

    if (param.value instanceof Logic) {
        const logicContext = param.value.buildContext(this.ruleContext);

        this.parameters.meta[name].status = logicContext.status();

        if (this.parameters.meta[name].status === 'ready') {
            this.parameters.values[name] = logicContext.currentValue;
        }

        logicContext.on('update', onDefinedUpdate.bind(this, name));

        this.parameters.contexts[name] = logicContext;
    } else {
        this.parameters.values[name] = param.value;
        this.parameters.meta[name].status = 'ready';
    }
}

function stopWatch(name) {
    if (!_.isNil(this.parameters.listeners[name])) {
        // Stop the old watch
        this.parameters.listeners[name]();
        this.parameters.listeners[name] = null;
    }
}

function processRequired(param, name) {
    const Logic = require('./logic'); // eslint-disable-line

    this.parameters.meta[name] = {
        required: true,
        status: 'undefined',
        watchId: null
    };

    if (param.value instanceof Logic) {
        const logicContext = param.value.buildContext(this.ruleContext);

        logicContext.on('update', (status, value) => {
            if (status !== 'ready') {
                // kill the watch
                this.parameters.meta[name].watchId = null;

                stopWatch.call(this, name);

                return;
            } else if (value === this.parameters.meta[name].watchId) {
                // Id did not change so no need to reload the watch
                return;
            }

            stopWatch.call(this, name);

            this.parameters.meta[name].watchId = value;

            this.parameters.listeners[name] = this.ruleContext.scope.watch(value, onDefinedUpdate.bind(this, name));
        });

        this.parameters.contexts[name] = logicContext;
    } else {
        const listener = this.ruleContext.scope.watch(param.value, onDefinedUpdate.bind(this, name));

        this.parameters.listeners[name] = listener;
        this.parameters.meta[name].watchId = param.value;
    }
}

function processParameters(parameters) {
    const Logic = require('./logic'); // eslint-disable-line

    _.forOwn(parameters, (param, name) => {
        if (param.required) {
            processRequired.call(this, param, name);
        } else {
            processDefinition.call(this, param, name);
        }
    });
}

function onFaultChange(faultValue) {
    this.control.isFaulted = faultValue;

    // Only manipulate the run state if allowed.
    if (this.options.onFaultChange) {
        _run.call(this);
    }

    this.emit('faultChange', faultValue || this._status.valueStatus !== 'ready');
}

function LogicContext(ruleContext, onSetup, onRun, onPause, onTeardown, parameters, previousContext, options) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(ruleContext, onSetup, onRun, onPause, onTeardown, parameters, previousContext, options);
    }

    this.ruleContext = ruleContext;

    this.parameters = {
        values: {},
        meta: {},
        contexts: {},
        // issues: [],
        listeners: {}
    };

    this.id = ShortId.generate();

    const defaultOptions = {
        onFaultChange: false
    };

    this.options = _.isNil(options) ? defaultOptions : options;

    if (this.options.useToken) {
        this.content = this.ruleContext.tokenContext;
    } else {
        this.content = this.ruleContext.tokenContext.getRaw();
    }

    this._status = {
        runStatus: 'stopped',
        valueStatus: 'undefined',
        lastEmited: null
    };

    this.livingIssues = [];

    this.onRun = onRun;
    this.onPause = onPause;
    this.onTeardown = onTeardown;

    processParameters.call(this, parameters);

    this.control = buildControl.call(this);

    this.previousContext = previousContext;

    if (!_.isNil(previousContext)) {
        this.previousContext.on('faultChange', onFaultChange, this);
    }

    if (!_.isNil(onSetup)) {
        this.currentValue = onSetup(this.control, this.content);
    } else {
        this.currentValue = undefined;
    }

    if (_.isNil(this.onRun)) {
        if (parameters.length > 0) {
            throw new Error('onRun was not defined even though define and/or required where called.');
        }
    }

    EventEmitter.call(this);
}

Util.inherits(LogicContext, EventEmitter);

LogicContext.prototype.faulted = function faulted() {
    Common.checkDisposed(this);

    let previousFault = false;

    if (!_.isNil(this.previousContext)) {
        previousFault = this.previousContext.faulted();
    }

    return previousFault || (this._status.valueStatus !== 'ready');
};

LogicContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    return this.livingIssues;
};

LogicContext.prototype.start = function start() {
    Common.checkDisposed(this);

    // If we are already starting or are started then we should not do anything.
    if (this._status.runStatus === 'started' || this._status.runStatus === 'starting') {
        return;
    }

    this._status.runStatus = 'starting';

    this.control.isFaulted = !_.isNil(this.previousContext) && this.previousContext.faulted();

    _.forOwn(this.parameters.contexts, (context) => {
        context.start();
    });

    _run.call(this);

    emitUpdate.call(this, true);

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

    updateValueStatus.call(this, 'undefined');

    _.forOwn(this.parameters.contexts, (context) => {
        context.stop();
    });

    if (!_.isNil(this.onPause)) {
        this.onPause(this.control, this.content, this.currentValue);
    }

    this.control.raise();

    emitUpdate.call(this, true);

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

    _.forOwn(this.parameters.listeners, listener => listener());

    const commits = [];

    _.forOwn(this.parameters.contexts, (context) => {
        commits.push(context.dispose().commit);
    });

    return {
        commit: () => {
            _.forEach(commits, (commit) => {
                commit();
            });

            updateValueStatus.call(this, 'undefined');

            if (!_.isNil(this.onTeardown)) {
                this.onTeardown(this.control, this.content, this.currentValue);
            }

            this.control.raise();

            emitUpdate.call(this, true);

            this._status.runStatus = 'disposed';
        }
    };
};

module.exports = LogicContext;
