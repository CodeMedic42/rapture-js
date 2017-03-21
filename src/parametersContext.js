const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');

function _calcStatus() {
    if (!_.isNil(this.currentStatus)) {
        return this.currentStatus;
    }

    let ready = true;

    _.forOwn(this.paramStatus, (paramStatus) => {
        if (paramStatus !== 'ready') {
            ready = false;
        }

        return ready;
    });

    return ready;
}

function run() {
    if (!_calcStatus.call(this)) {
        if (this.lastEmited !== 'undefined') {
            this.lastEmited = 'undefined';

            this.emit('update', 'undefined');
        }

        return;
    }

    this.lastEmited = 'ready';

    this.emit('update', 'ready', this.params);
}

function updateParam(name, paramStatus, value) {
    this.currentStatus = null;

    this.paramStatus[name] = paramStatus;

    if (paramStatus === 'ready') {
        this.params[name] = value;
    }

    if (this.runStatus === 'started') {
        run.call(this);
    }
}

function ParametersContext(ruleContext, params, owenerId) {
    if (!(this instanceof ParametersContext)) {
        return new ParametersContext(ruleContext, params, owenerId);
    }

    EventEmitter.call(this);

    this.currentStatus = params.length <= 0 ? true : null;

    this.runStatus = 'stopped';
    this.paramStatus = {};
    this.params = {};
    this.contexts = [];

    const LogicDefinition = require('./logicDefinition'); // eslint-disable-line

    _.forOwn(params, (value, name) => {
        if (value instanceof LogicDefinition) {
            this.paramStatus[name] = 'undefined';

            const logicContext = value.buildContext(ruleContext, owenerId);

            this.paramStatus[name] = logicContext.status();
            this.params[name] = logicContext.currentValue;

            logicContext.on('update', updateParam.bind(this, name));

            this.contexts.push(logicContext);
        } else if (!_.isNil(value)) {
            this.params[name] = value;
        } else {
            this.paramStatus[name] = 'undefined';

            ruleContext.scope.watch(name, updateParam.bind(this, name));
        }
    });

    EventEmitter.call(this);
}

Util.inherits(ParametersContext, EventEmitter);

ParametersContext.prototype.start = function start() {
    if (this.runStatus === 'started' || this.runStatus === 'starting') {
        return;
    }

    this.runStatus = 'starting';

    _.forEach(this.contexts, (context) => {
        context.start();
    });

    run.call(this);

    this.runStatus = 'started';
};

ParametersContext.prototype.stop = function start() {
    if (this.runStatus === 'stopped' || this.runStatus === 'stopping') {
        return;
    }

    this.runStatus = 'stopping';

    run.call(this);

    _.forEach(this.contexts, (context) => {
        context.stop();
    });

    this.runStatus = 'stopped';
};

ParametersContext.prototype.status = function status() {
    if (this.runStatus !== 'started') {
        return 'undefined';
    }

    return _calcStatus.call(this) ? 'ready' : 'undefined';
};

module.exports = ParametersContext;
