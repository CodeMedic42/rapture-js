const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const Issue = require('./issue');
const ShortId = require('shortid');

function updateValueStatus(newStatus) {
    if (this.valueStatus === newStatus) {
        return;
    }

    this.valueStatus = newStatus;

    const fault = this.valueStatus !== 'ready' || (_.isNil(this.previousContext) ? false : this.previousContext.faulted());

    this.emit('faultChange', fault);
}

function emitUpdate(force) {
    if (this.runStatus === 'started' || force) {
        this.lastEmited = this.valueStatus;
        this.emit('update', this.valueStatus, this.currentValue);

        return;
    }

    this.runStatus = 'emitNeeded';
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
    if (newIssues.length === 0 && this.livingIssues.length === 0) {
        return;
    }

    if (newIssues.length > 0) {
        updateValueStatus.call(this, 'failed');
    }

    this.compactedIssues = null;

    this.livingIssues = newIssues;

    emitUpdate.call(this);
}

function _pause() {
    if (!_.isNil(this.onPause)) {
        this.onPause(this.control, this.ruleContext.tokenValue, this.currentValue);
    }

    // clear any living issues.
    raise.call(this);
}

function _teardown() {
    updateValueStatus.call(this, 'undefined');

    _.forOwn(this.parameters.contexts, (context) => {
        context.stop();
    });

    if (!_.isNil(this.onPause)) {
        this.onPause(this.control, this.ruleContext.tokenValue, this.currentValue);
    }

    // clear any living issues.
    raise.call(this);
}

function _run() {
    let ready = true;
    const issues = [];

    _.forOwn(this.parameters.values, (value, name) => {
        const paramStatus = this.parameters.meta[name].status;

        if (this.parameters.meta[name].required) {
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
            // Then for some reason the definition is no ready yet.
            // We can no idea why so we are not going to do anything here.
            ready = false;
        } else if (paramStatus === 'failed') {
            // There is a context with issues here.
            issues.push(...this.parameters.contexts[name].issues());

            ready = false;
        } else if (paramStatus === 'ready') {
            // Everything is good here
        } else {
            throw new Error('Should never get here.');
        }
    });

    if (this.parameters.issues.length !== 0 || issues.length !== 0) {
        // Something has changed, clear the compactedIssues.
        this.compactedIssues = null;
        this.parameters.issues = issues;
    }

    if (issues.length > 0) {
        // this.currentValue = undefined;
        updateValueStatus.call(this, 'failed');
        this.lastEmited = null;

        _pause.call(this);
    } else if (!ready) {
        // this.currentValue = undefined;
        updateValueStatus.call(this, 'undefined');
        this.lastEmited = null;

        _pause.call(this);
    } else {
        let ret = this.currentValue;

        // Current value could have been set by setup.\
        // So even if onRun does not exists we will still want to emit the value when we start up..
        if (!_.isNil(this.onRun)) {
            ret = this.onRun(this.control, this.ruleContext.tokenValue, this.parameters.values, this.currentValue);
        }

        if (this.livingIssues.length <= 0) {
            updateValueStatus.call(this, 'ready');

            // Even if ret and the current value match if we have never emitted it then we should.
            if (ret === this.currentValue && this.lastEmited === 'ready') {
                return;
            }
        } else {
            updateValueStatus.call(this, 'failed');
        }

        this.currentValue = ret;
    }

    emitUpdate.call(this);
}

function createRuleContext(rule, tokenContext) {
    let runContext;

    if (_.isNil(tokenContext)) {
        runContext = this.ruleContext.runContext;
    } else {
        const RunContext = require('./runContext.js'); // eslint-disable-line

        runContext = RunContext(this.ruleContext.scope.parentScope);

        tokenContext.addRunContext(runContext);
    }

    return runContext.createRuleContext(rule);
}

function buildLogicContext(logicDefinition) {
    return logicDefinition.buildContext(this.ruleContext);
}

function register(targetScope, id, value, status) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = '__working';
    }

    if (_targetScope === '__working') {
        this.ruleContext.scope.parentScope.set(null, id, value, status, this);
    } else {
        this.ruleContext.scope.set(_targetScope, id, value, status, this);
    }
}

function unregister(targetScope, id) {
    let _targetScope = targetScope;

    if (_.isNil(_targetScope)) {
        _targetScope = '__working';
    }

    if (_targetScope === '__working') {
        this.ruleContext.scope.parentScope.remove(null, id, this);
    } else {
        this.ruleContext.scope.remove(_targetScope, id, this);
    }
}

function buildControl() {
    return {
        raise: raise.bind(this),
        data: this.ruleContext.data,
        id: this.id,
        createRuleContext: createRuleContext.bind(this),
        buildLogicContext: buildLogicContext.bind(this),
        register: register.bind(this),
        unregister: unregister.bind(this)
    };
}

function onDefinedUpdate(name, status, value) {
    this.parameters.meta[name].status = status;
    this.parameters.values[name] = value;

    if (this.runStatus === 'started') {
        _run.call(this);
    }
}

function processParameters(parameters) {
    const LogicDefinition = require('./logicDefinition'); // eslint-disable-line

    _.forOwn(parameters, (value, name) => {
        if (value instanceof LogicDefinition) {
            this.parameters.meta[name] = {};

            const logicContext = value.buildContext(this.ruleContext);

            this.parameters.meta[name] = {
                status: logicContext.status()
            };

            this.parameters.values[name] = logicContext.currentValue;

            logicContext.on('update', onDefinedUpdate.bind(this, name));

            this.parameters.contexts[name] = logicContext;
        } else if (!_.isNil(value)) {
            this.parameters.values[name] = value;
            this.parameters.meta[name] = {
                status: 'ready'
            };
        } else {
            this.parameters.meta[name] = {
                status: 'undefined',
                required: true
            };

            this.ruleContext.scope.watch(name, onDefinedUpdate.bind(this, name));
        }
    });
}

function onFaultChange(faultValue) {
    this.control.isFaulted = faultValue;

    // Only manipulate the run state if allowed.
    if (this.options.onFaultChange) {
        _run.call(this);
    }

    this.emit('faultChange', faultValue || this.valueStatus !== 'ready');
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
        issues: []
    };

    this.id = ShortId.generate();

    const defaultOptions = {
        onFaultChange: false
    };

    this.options = _.isNil(options) ? defaultOptions : options;

    this.runStatus = 'stopped';
    this.valueStatus = 'undefined';
    this.lastEmited = 'undefined';

    this.livingIssues = [];
    this.compactedIssues = [];

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
        this.currentValue = onSetup(this.control, this.ruleContext.tokenValue);
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
    let previousFault = false;

    if (!_.isNil(this.previousContext)) {
        previousFault = this.previousContext.faulted();
    }

    return previousFault || (this.valueStatus !== 'ready');
};

LogicContext.prototype.issues = function issues() {
    if (!_.isNil(this.compactedIssues)) {
        return this.compactedIssues;
    }

    this.compactedIssues = [...this.parameters.issues];
    this.compactedIssues.push(...this.livingIssues);

    return this.compactedIssues;
};

LogicContext.prototype.start = function start() {
    // If we are already starting or are started then we should not do anything.
    if (this.runStatus === 'started' || this.runStatus === 'starting') {
        return;
    }

    this.runStatus = 'starting';

    this.control.isFaulted = !_.isNil(this.previousContext) && this.previousContext.faulted();

    _.forOwn(this.parameters.contexts, (context) => {
        context.start();
    });

    _run.call(this);

    if (this.runStatus === 'emitNeeded') {
        emitUpdate.call(this, true);
    }

    this.runStatus = 'started';
};

LogicContext.prototype.stop = function start() {
    // If we are already stopping or are stopped then we should not do anything.
    if (this.runStatus === 'stopped' || this.runStatus === 'stopping') {
        return;
    }

    this.runStatus = 'stopping';

    updateValueStatus.call(this, 'undefined');

    _.forOwn(this.parameters.contexts, (context) => {
        context.stop();
    });

    _pause.call(this);

    if (this.runStatus === 'emitNeeded') {
        emitUpdate.call(this, true);
    }

    this.runStatus = 'stopped';
};

LogicContext.prototype.status = function status() {
    return this.valueStatus;
};

LogicContext.prototype.destroy = function destroy() {
    this.runStatus = 'teardown';

    _teardown.call(this);

    if (this.runStatus === 'emitNeeded') {
        emitUpdate.call(this, true);
    }

    this.runStatus = 'destroyed';
};

module.exports = LogicContext;
