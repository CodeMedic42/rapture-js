const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const ShortId = require('shortid');
// const Console = require('console');
const Issue = require('./issue');
const Common = require('./common.js');
const Scope = require('./scope.js');

let __Logic;

const defaultOptions = {
    state: { // Defines what makes up the state of the logic
        content: false, // Use the state of the content to determine state. // default: false
        parameters: true, // Use the state of the parameters to determine state. // default: true
        rule: false // use the current state of the rule to determine state. // default: false
    },
    value: { // As values change onValid/onInvalid will be called as appropriate based on the state
        content: false, // Will force a re-run of the onValid/onInvalid when the value changes. // default: 'true'
        parameters: true // Will force a re-run of the onValid/onInvalid when any parameter value changes. // default: 'true'
    },
    contentWatch: 'shallow', // Defines how much of the content needs to change to trigger a re-run. // default: 'shallow'
    useToken: false // Define how the content is presented to onStart, onStop, onValid, onInvalid // default: false
};

function executeCallback(cbName, ...args) {
    if (!_.isNil(this._callbacks[cbName])) {
        this._callbacks[cbName](...args);
    }
}

function getLogicType() {
    if (_.isNil(__Logic)) {
        __Logic = require('./logic.js'); // eslint-disable-line
    }

    return __Logic;
}

function runEmits(force) {
    if (!force && this._status.runState !== 'started') {
        return;
    }

    if (this._status.raiseEmitPending) {
        this._status.raiseEmitPending = false;

        this.emit('raise');
    }

    if (this._status.valueEmitPending) {
        this._status.valueEmitPending = false;

        this.emit('update', this._status.valueState, this._currentValue);
    }

    if (this._status.stateEmitPending) {
        this._status.stateEmitPending = false;

        this.emit('state', this._status.ruleState);
    }
}

function calculateValidState() {
    let newValidState = 'failing';

    // Calculate the total state of this logic context
    if ((!this._options.state.parameters || this._status.parametersState === 'passing') && // If we care about the state of the parameters
        (!this._options.state.rule || this._status.previousRuleState === 'passing') && // If we care about the state of the rule
        (!this._options.state.content || this._status.contentState === 'passing')) { // If we care about the state of the content
        newValidState = 'passing';
    }

    if (this._status.validState !== newValidState) {
        this._status.validState = newValidState;

        this._status.evalPending = true;
    }
}

function calculateState() {
    let newState = this._status.validState;

    if (this._status.runState === 'stopped' || this._status.runState === 'stopping') {
        newState = 'passing';
    } else {
        newState = this._status.validationState;
    }

    if (this._status.state !== newState) {
        this._status.state = newState;
    }
}

function calculateRuleState() {
    let newRuleState = this._status.previousRuleState;

    if (newRuleState === 'passing') {
        newRuleState = this._status.state;
    }

    if (this._status.ruleState !== newRuleState) {
        this._status.ruleState = newRuleState;

        this._status.stateEmitPending = true;
    }
}

function calculateValueState() {
    let newValueState = 'failing';

    if (this._status.runState === 'stopped' || this._status.runState === 'stopping') {
        newValueState = 'undefined';
    } else if (this._status.state === 'passing') {
        newValueState = _.isUndefined(this._currentValue) ? 'undefined' : 'defined';
    }

    if (this._status.valueState !== newValueState) {
        this._status.valueState = newValueState;

        this._status.valueEmitPending = true;
    }
}

function calculateStates() {
    calculateValidState.call(this);
    calculateState.call(this);
    calculateRuleState.call(this);
    calculateValueState.call(this);
}

function calculatParameterState() {
    let ready = true;

    _.forOwn(this._parameters.state, (state, name) => {
        const required = this._parameters.meta[name].required;

        if (required) {
            if (state === 'undefined') {
                // Console.warn(`Required rule value "${name}" is not defined.`);
                // The required value has never been defined and this is an issue.
                // issues.push(Issue('rule', null, null, `Required rule value "${name}" is not defined.`, 'warning'));

                ready = false;
            } else if (state === 'failing') {
                // The required value has been defined but it's validation is failing.
                // The validation should be generating an issue for it so no need to create a new one.
                // This still marks us as not ready to run.
                ready = false;
            } else if (state !== 'defined') {
                throw new Error('Should never get here.');
            }

            return;
        }

        if (state === 'undefined') {
            // Then for some reason the definition is not ready yet.
            // We can no idea why so we are not going to do anything here.
            ready = false;
        } else if (state === 'failing') {
            // There is a context with issues here.

            ready = false;
        } else if (state !== 'defined') {
            throw new Error('Should never get here.');
        }
    });

    const newParamStatus = ready ?
        'passing' :
        'failing';

    if (newParamStatus !== this._status.parametersState) {
        this._status.parametersState = newParamStatus;

        if (this._options.state.parameters) {
            this._status.evalPending = true;
        }

        calculateStates.call(this);
    }
}

function _raise(...issueMeta) {
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

    this._status.validationState = 'failing';

    // If both are empty then don't emit anything. It just creates noise.
    if (newIssues.length > 0 || this._livingIssues.length > 0) {
        this._livingIssues = newIssues;

        this._status.raiseEmitPending = true;
    }

    calculateStates.call(this);

    runEmits.call(this);
}

function _clear() {
    if (this._livingIssues.length > 0) {
        this._livingIssues = [];

        this._status.raiseEmitPending = true;
    }

    this._status.validationState = 'passing';

    calculateStates.call(this);

    runEmits.call(this);
}

function _set(value) {
    if (value === this._currentValue) {
        return false; // Did not result in an update
    }

    this._currentValue = value;

    calculateStates.call(this);

    this._status.valueEmitPending = true;

    runEmits.call(this);

    return true; // Did result in an update
}

function _evaluate(force) {
    if (!force && (this._status.runState !== 'started' || !this._status.evalPending)) {
        return;
    }

    this._status.evalPending = false;

    const oldRunState = this._status.runState;
    this._status.runState = 'updating';

    if (this._status.validState === 'passing') {
        executeCallback.call(this, 'onValid', this._control, this._content, this._parameters.values, this._parameters.state);
    } else {
        executeCallback.call(this, 'onInvalid', this._control, this._content, this._parameters.values, this._parameters.state);
    }

    this._status.runState = oldRunState;
}

function _onPreviousStateUpdate(state) {
    if (this._status.previousRuleState === state) {
        return;
    }

    this._status.previousRuleState = state;

    if (this._options.state.rule) {
        this._control.state.rule = this._status.previousRuleState;

        calculateStates.call(this);

        _evaluate.call(this);
    }

    // recalc after eval or just in general.
    calculateStates.call(this);

    runEmits.call(this);
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

function buildLogicContext(logic) {
    const logicContext = logic.buildContext(`${this._id}`, this._ruleContext);

    this._ruleContext.addLogicContext(logicContext);

    return logicContext;
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

function _buildControl() {
    const data = _.isPlainObject(this._options.data) ? this._options.data : {};

    data.$shared = this._ruleContext.data;

    this._control = {
        data,
        id: this._id,
        name: this._name,
        uuid: this._uuid,
        state: {}
    };

    if (this._controlType === 'full') {
        this._control.set = _set.bind(this);
        this._control.raise = _raise.bind(this);
        this._control.clear = _clear.bind(this);
        this._control.createRuleContext = createRuleContext.bind(this);
        this._control.createRuleContextInScope = createRuleContextInScope.bind(this);
        this._control.buildLogicContext = buildLogicContext.bind(this);
        this._control.register = register.bind(this);
        this._control.unregister = unregister.bind(this);
        this._control.scope = this._ruleContext.scope;
    } else if (this._controlType === 'set') {
        this._control.set = _set.bind(this);
    } else if (this._controlType === 'raise') {
        this._control.raise = _raise.bind(this);
        this._control.clear = _clear.bind(this);
    }
}

function _updateParameter(calculate, name, status, value) {
    if (this._parameters.state[name] !== status) {
        this._parameters.state[name] = status;

        if (calculate) {
            calculatParameterState.call(this);
        }
    }

    if (status === 'defined') {
        if (this._parameters.values[name] !== value) {
            this._parameters.values[name] = value;

            this._status.evalPending = true;
        }
    } else if (!_.isUndefined(this._parameters.values[name])) {
        delete this._parameters.values[name];

        this._status.evalPending = true;
    }
}

function onParameterUpdate(name, status, value) {
    const started = this._status.runState === 'started';

    _updateParameter.call(this, started, name, status, value);

    if (started) {
        _evaluate.call(this);

        runEmits.call(this, true);
    }
}

function stopWatch(name) {
    if (!_.isNil(this._parameters.listeners[name])) {
        // Stop the old watch
        this._parameters.listeners[name]();
        delete this._parameters.listeners[name];
    }
}

function _onWatchUpdate(name, status, value) {
    if (status !== 'defined') {
        // kill the watch
        this._parameters.meta[name].watchId = null;

        stopWatch.call(this, name);

        onParameterUpdate.call(this, name, status, value);

        return;
    } else if (value === this._parameters.meta[name].watchId) {
        // Id did not change so no need to reload the watch
        return;
    }

    stopWatch.call(this, name);

    this._parameters.meta[name].watchId = value;

    this._parameters.listeners[name] = this._ruleContext.scope.watch(value, onParameterUpdate.bind(this, name));
}

function processRequired(param, name) {
    this._parameters.meta[name] = {
        required: true,
        watchId: null
    };

    this._parameters.state[name] = 'undefined';

    if (param.value instanceof getLogicType()) {
        const logicContext = param.value.buildContext(this._id, this._ruleContext, this._previousLogicContext);

        _updateParameter.call(this, false, name, 'undefined', undefined);

        const update = _onWatchUpdate.bind(this, name);

        logicContext.on('update', update);

        update(logicContext.valueState(), logicContext.value());

        this._parameters.contexts[name] = logicContext;
    } else {
        const listener = this._ruleContext.scope.watch(param.value, onParameterUpdate.bind(this, name));

        this._parameters.listeners[name] = listener;
        this._parameters.meta[name].watchId = param.value;
    }
}

function processDefinition(param, name) {
    this._parameters.meta[name] = {
        required: false,
        // status: 'undefined',
        watchId: null
    };

    this._parameters.state[name] = 'undefined';

    if (param.value instanceof getLogicType()) {
        const logicContext = param.value.buildContext(this._id, this._ruleContext, this._previousLogicContext);

        _updateParameter.call(this, false, name, logicContext.valueState(), logicContext.value());

        this._parameters.listeners[name] = Common.createListener(logicContext, 'update', null, onParameterUpdate.bind(this, name));
        this._parameters.contexts[name] = logicContext;
    } else {
        this._parameters.values[name] = param.value;
        this._parameters.state[name] = 'defined';
    }
}

function processParameters(parameters) {
    this._parameters = {
        values: {},
        meta: {},
        contexts: {},
        listeners: {},
        state: {}
    };

    _.forOwn(parameters, (param, name) => {
        if (param.required) {
            processRequired.call(this, param, name);
        } else {
            processDefinition.call(this, param, name);
        }
    });

    this._disposables.push(() => {
        _.forOwn(this._parameters.listeners, (listener) => {
            if (!_.isNil(listener)) {
                listener();
            }
        });
    });

    calculatParameterState.call(this);
}

function validateInput(properties, callbacks, parameters) {
    if (_.isNil(properties)) {
        throw new Error('The properties argument is required');
    }

    if (!_.isString(properties.name) || properties.name.length <= 0) {
        throw new Error('name must be a valid string');
    }

    if (_.isNil(callbacks)) {
        throw new Error('The callbacks argument is required');
    }

    if (_.isNil(parameters)) {
        throw new Error('The parameters argument is required');
    }
}

function setupRuleConnetion(previousLogic) {
    if (_.isNil(previousLogic)) {
        // No need to CONSTANTLY be checking to see if we have previous logic.
        this._status.previousRuleState = 'passing';

        if (this._options.state.rule) {
            this._control.state.rule = this._status.previousRuleState;
        }

        return;
    }

    this._previousLogicContext = previousLogic;

    this._disposables.push(Common.createListener(previousLogic, 'state', this, _onPreviousStateUpdate, () => {
        this._previousLogicContext = null;
    }));

    this._status.previousRuleState = previousLogic.ruleState();

    if (this._options.state.rule) {
        this._control.state.rule = this._status.previousRuleState;
    }
}

function updateContentState() {
    const newState = this._tokenContext.issues().length <= 0 ?
        'passing' :
        'failing';

    if (this._status.contentState !== newState) {
        this._status.contentState = newState;
        this._control.state.content = newState;

        calculateStates.call(this);

        this._status.evalPending = true;
    }
}

function setupContentRequirements() {
    if (this._options.useToken) {
        this._content = this._tokenContext;
    } else {
        this._content = this._tokenContext.getRaw();
    }

    // if (!this._options.state.content && (!this._options.value.content || this._options.contentWatch !== 'deep')) {
    //     return;
    // }

    this._tokenContext.on('update', (value) => {
        if (value.raise && this._options.state.content) {
            updateContentState.call(this);
        }

        if (value.update) {
            if (this._options.value.content && this._options.contentWatch === 'deep') {
                this._status.evalPending = true;
            }

            if (!this._options.useToken) {
                this._content = this._tokenContext.getRaw();
            }
        }

        _evaluate.call(this);

        runEmits.call(this);
    });

    if (this._options.state.content) {
        updateContentState.call(this);
    }
}

function LogicContext(properties, callbacks, parameters, options) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(properties, callbacks, parameters, options);
    }

    EventEmitter.call(this);

    validateInput(properties, callbacks, parameters, options);

    this._options = _.merge({}, defaultOptions, options); // _.isNil(options) ? defaultOptions : options;

    this._disposables = [];

    this._ruleContext = properties.parent;

    this._controlType = properties.controlType;
    this._name = properties.name;
    this._uuid = ShortId.generate();
    this._id = properties.id || `${properties.name}-${this._uuid}`;
    this._tokenContext = this._ruleContext.tokenContext;

    // this._content = this._options.useToken ?
    //     this._tokenContext :
    //     this._tokenContext.getRaw();

    this._status = {
        runState: 'stopped',
        valueState: 'undefined', // Indicates the status of the logic value
        state: 'passing', // Indicates the status of the entire logic
        validationState: 'passing', // Indicates the status of the logic validation,
        ruleState: 'passing',
        parametersState: 'passing',
        contentState: 'passing',
        validState: 'passing',
        evalPending: false,
        valueEmitPending: false,
        raiseEmitPending: false,
        stateEmitPending: false,
    };

    this._livingIssues = [];

    this._callbacks = callbacks;

    this._currentValue = undefined;

    processParameters.call(this, parameters);

    _buildControl.call(this);

    setupContentRequirements.call(this);

    setupRuleConnetion.call(this, properties.previous);

    executeCallback.call(this, 'onBuild', this._control);

    // clear these since there is no way for someone to be listening yet.
    this._status.valueEmitPending = false;
    this._status.stateEmitPending = false;
    this._status.raiseEmitPending = false;
    this._status.evalPending = true;
}

Util.inherits(LogicContext, EventEmitter);

LogicContext.prototype.state = function state() {
    Common.checkDisposed(this);

    return this._status.state;
};

LogicContext.prototype.valueState = function state() {
    Common.checkDisposed(this);

    return this._status.valueState;
};

LogicContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    return this._livingIssues;
};

LogicContext.prototype.start = function start() {
    Common.checkDisposed(this);

    // If we are already starting or are started then we should not do anything.
    if (this._status.runState === 'started' || this._status.runState === 'starting') {
        return;
    }

    this._status.runState = 'starting';

    this.emit('starting');

    executeCallback.call(this, 'onStart', this._control, this._content);

    _.forOwn(this._parameters.contexts, (context) => {
        context.start(null, this._control, this._content);
    });

    calculatParameterState.call(this);
    calculateStates.call(this);

    _evaluate.call(this, true);

    runEmits.call(this, true);

    this._status.runState = 'started';

    this.emit('started');
};

LogicContext.prototype.stop = function stop() {
    // Fail because we are already disposed.
    Common.checkDisposed(this);

    // If we are already stopping or are stopped then we should not do anything.
    if (this._status.runState === 'stopped' || this._status.runState === 'stopping') {
        return;
    }

    this._status.runState = 'stopping';

    this.emit('stopping');

    _.forOwn(this._parameters.contexts, (context) => {
        context.stop();
    });

    executeCallback.call(this, 'onStop', this._control, this._content);

    _clear.call(this);

    calculateStates.call(this);

    runEmits.call(this, true);

    this._status.runState = 'stopped';

    this.emit('stopped');
};

LogicContext.prototype.value = function value() {
    Common.checkDisposed(this);

    return this._currentValue;
};

LogicContext.prototype.dispose = function dispose() {
    // Warn the user that disposed has already been called.
    Common.checkDisposed(this, true);

    // If we are already disposed or are disposing then we should not do anything.
    if (this._status.runState === 'disposed' || this._status.runState === 'disposing') {
        return { commit: () => {} };
    }

    this._status.runState = 'stopping';

    this.emit('stopping');

    executeCallback.call(this, 'onStop', this._control, this._content);

    this._status.runState = 'disposing';

    this.emit('disposing');

    // clean up all listeners watches and evenrs first
    _.forEach(this._disposables, (listener) => {
        listener();
    });

    const commits = [];

    _.forOwn(this._parameters.contexts, (context) => {
        commits.push(context.dispose().commit);
    });

    return {
        commit: () => {
            executeCallback.call(this, 'onDispose', this._control);

            _.forEach(commits, (commit) => {
                commit();
            });

            _clear.call(this);

            runEmits.call(this, true);

            this._status.runState = 'disposed';

            this.emit('disposed');
        }
    };
};

LogicContext.prototype.ruleState = function ruleState() {
    Common.checkDisposed(this);

    return this._status.ruleState;
};

module.exports = LogicContext;
