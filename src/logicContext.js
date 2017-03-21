const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');

function _emitUndefied() {
    this.valueReady = false;

    // If we have already emitted undefined then no need to do so again.
    if (this.lastEmited !== 'undefined') {
        this.lastEmited = 'undefined';

        this.emit('update', 'undefined');
    }
}

function _run() {
    if (this.paramsStatus !== 'ready') {
        _emitUndefied.call(this);

        return;
    }

    let ret = this.currentValue;

    if (!_.isNil(this.onRun)) {
        ret = this.onRun(this.params);
    }

    this.valueReady = true;

    // Even if ret and the current value match if we have never emitted
    // that we are ready then we need to do so.
    if (ret === this.currentValue && this.lastEmited === 'ready') {
        return;
    }

    this.currentValue = ret;

    this.lastEmited = 'ready';

    this.emit('update', 'ready', ret);
}

function LogicContext(onSetup, onRun, onPause, parametersContext, registrationsContext) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(onSetup, onRun, onPause, parametersContext, registrationsContext);
    }

    this.runStatus = 'stopped';
    this.lastEmited = 'undefined';
    this.valueReady = false;

    this.onRun = onRun;
    this.onPause = onPause;

    this.registrationsContext = registrationsContext;
    this.parametersContext = parametersContext;

    if (_.isNil(parametersContext)) {
        // Since there are no params then this will always be ready.
        this.paramsStatus = 'ready';
    } else {
        // Lets get the current status.
        this.paramsStatus = this.parametersContext.status();

        // Lets watch for changes.
        parametersContext.on('update', (status, params) => {
            this.paramsStatus = status;
            this.params = params;

            // Only run is we are completely started.
            if (this.runStatus === 'started') {
                _run.call(this);
            }
        });
    }

    if (!_.isNil(onSetup)) {
        this.currentValue = onSetup();
    } else {
        this.currentValue = undefined;
    }

    if (_.isNil(this.onRun)) {
        // Since there is no onRun then the currentValue is all it will ever be.
        // this.lastEmited = 'ready';
        this.valueReady = true;
    }

    EventEmitter.call(this);
}

Util.inherits(LogicContext, EventEmitter);

LogicContext.prototype.start = function start() {
    // If we are already starting or are started then we should not do anything.
    if (this.runStatus === 'started' || this.runStatus === 'starting') {
        return;
    }

    this.runStatus = 'starting';

    if (!_.isNil(this.registrationsContext)) this.registrationsContext.start();
    if (!_.isNil(this.parametersContext)) this.parametersContext.start();

    _run.call(this);

    this.runStatus = 'started';
};

LogicContext.prototype.stop = function start() {
    // If we are already stopping or are stopped then we should not do anything.
    if (this.runStatus === 'stopped' || this.runStatus === 'stopping') {
        return;
    }

    this.runStatus = 'stopping';

    if (!_.isNil(this.registrationsContext)) this.registrationsContext.stop();
    if (!_.isNil(this.parametersContext)) this.parametersContext.stop();

    _emitUndefied.call(this);

    this.onPause(this.params);

    this.runStatus = 'stopped';
};

LogicContext.prototype.status = function status() {
    if (this.runStatus !== 'started') {
        return 'undefined';
    }

    return this.valueReady ? 'ready' : 'undefined';
};

module.exports = LogicContext;
