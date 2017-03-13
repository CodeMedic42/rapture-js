const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');

function updateParam(status, value) {
    this.paramState[name] = status;

    if (status == 'ready') {
        this.runContext.params[name] = value;
    }

    this.run();
}

function LogicContext(ruleContext, onRun, onPause, params, allowRaise) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(ruleContext, onRun, onPause, params, allowRaise);
    }

    // this.logicScope = Scope();
    this.onRun = onRun;
    this.onPause = onPause;
    this.paramStatus = {};
    this.contents = ruleContext.tokenContext.contents;

    this.runContext = {
        link: ruleContext.link.bind(ruleContext),
        params: {}
    };

    if (allowRaise) {
        this.runContext.raise = ruleContext.raise.bind(ruleContext, this);
        this.runContext.clear = ruleContext.clear.bind(ruleContext, this);
    }

    _.forOwn(params, (value, name) => {
        if (value instanceof LogicDefinition) {
            this.paramStatus[name] = 'undefined';

            const logicContext = value.buildContext();

            logicContext.on('update', updateParam.bind(this));
        } else if (!_.isNil(value)) {
            this.runContext.params[id] = value;
        } else {
            this.paramStatus[name] = 'undefined';

            ruleContext.workingScope(name, updateParam.bind(this));
        }
    });


    EventEmitter.call(this);
}

Util.inherits(LogicContext, EventEmitter);

function _run(logicContext) {
    if (!this.ready) {

    }
    let ready = this.ready;

    if (ready)
    _.forOwn(this.paramStatus, (status) => {
        if (status !== 'ready') {
            ready = false;
        }

        return ready;
    });

    if (!ready) {
        this.emit('update', 'undefined');

        return;
    }

    const ret = this.onRun.call(null, this.runContext, this.contents);

    this.emit('update', 'ready', ret);
};

LogicContext.prototype.run = _.debounce(function _run() {
    _run.call(this);
}, 50, {
    maxWait: 100
});

LogicContext.prototype.start = function start() {
    this.ready = true;
});

LogicContext.prototype.stop = function start() {
    this.ready = false;
});

module.exports = LogicContext;
