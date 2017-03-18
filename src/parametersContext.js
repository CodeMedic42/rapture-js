const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');

function run() {
    let ready = true;

    // Check all the params to make sure we can run
    _.forOwn(this.paramStatus, (paramStatus) => {
        if (paramStatus !== 'ready') {
            ready = false;
        }

        return ready;
    });

    if (!ready) {
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
    this.paramStatus[name] = paramStatus;

    if (paramStatus === 'ready') {
        this.params[name] = value;
    }

    if (this.runStatus === 'started') {
        run.call(this);
    }
}

function ParametersContext(ruleContext, params) {
    if (!(this instanceof ParametersContext)) {
        return new ParametersContext(ruleContext, params);
    }

    this.runStatus = 'stopped';
    this.paramStatus = {};
    this.params = {};
    this.contexts = [];

    const LogicDefinition = require('./logicDefinition'); // eslint-disable-line

    _.forOwn(params, (value, name) => {
        if (value instanceof LogicDefinition) {
            this.paramStatus[name] = 'undefined';

            const logicContext = value.buildContext(ruleContext);

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
    this.runStatus = 'starting';

    _.forEach(this.contexts, (context) => {
        context.start();
    });

    run.call(this);

    this.runStatus = 'started';
};

ParametersContext.prototype.stop = function start() {
    this.runStatus = 'stopping';

    run.call(this);

    _.forEach(this.contexts, (context) => {
        context.stop();
    });

    this.runStatus = 'stopped';
};

module.exports = ParametersContext;
