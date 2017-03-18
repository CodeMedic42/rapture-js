const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');

function _emitUndefied() {
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

    this.runStatus = false;
    this.onSetup = onSetup;
    this.onRun = onRun;
    this.onPause = onPause;
    this.parametersContext = parametersContext;
    this.paramsStatus = 'undefined';
    this.registrationsContext = registrationsContext;

    parametersContext.on('update', (status, params) => {
        this.paramsStatus = status;
        this.params = params;

        if (this.runStatus === 'started') {
            _run.call(this);
        }
    });

    if (!_.isNil(this.onSetup)) {
        this.currentValue = this.onSetup();
    }

    EventEmitter.call(this);
}

Util.inherits(LogicContext, EventEmitter);

LogicContext.prototype.start = function start() {
    this.runStatus = 'starting';

    this.registrationsContext.start();
    this.parametersContext.start();

    _run.call(this);

    this.runStatus = 'started';
};

LogicContext.prototype.stop = function start() {
    this.runStatus = 'stopping';

    this.registrationsContext.stop();
    this.parametersContext.stop();

    _emitUndefied();

    this.onPause(this.params);

    this.runStatus = 'stopped';
};

module.exports = LogicContext;
