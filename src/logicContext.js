const EventEmitter = require('events');
const Util = require('util');

function _run() {
    if (this.paramsStatus !== 'ready') {
        if (this.lastEmited !== 'undefined') {
            this.lastEmited = 'undefined';

            this.emit('update', 'undefined');
        }

        return;
    }

    const ret = this.onRun(this.params);

    if (ret === this.currentValue) {
        return;
    }

    this.currentValue = ret;

    this.lastEmited = 'ready';

    this.emit('update', 'ready', ret);
}

function LogicContext(onSetup, onRun, onPause, parametersContext) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(onSetup, onRun, onPause, parametersContext);
    }

    this.runStatus = false;
    this.onSetup = onSetup;
    this.onRun = onRun;
    this.onPause = onPause;
    this.parametersContext = parametersContext;
    this.paramsStatus = 'undefined';
    parametersContext.on('update', (status, params) => {
        this.paramsStatus = status;
        this.params = params;

        if (this.runStatus === 'started') {
            _run.call(this);
        }
    });

    this.onSetup();

    EventEmitter.call(this);
}

Util.inherits(LogicContext, EventEmitter);

LogicContext.prototype.start = function start() {
    this.runStatus = 'starting';

    this.parametersContext.start();

    _run.call(this);

    this.runStatus = 'started';
};

LogicContext.prototype.stop = function start() {
    this.runStatus = 'stopping';

    this.parametersContext.stop();

    this.onPause();

    this.runStatus = 'stopped';
};

module.exports = LogicContext;
