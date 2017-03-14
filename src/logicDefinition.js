const _ = require('lodash');

const ParametersContext = require('./parametersContext');
const LogicContext = require('./logicContext');

let currentId = 0;

function getId() {
    currentId = currentId += 1;

    return currentId;
}

function noop() {}

function LogicDefinition(setupCallback, allowRaise, allowLink) {
    if (!(this instanceof LogicDefinition)) {
        return new LogicDefinition(setupCallback, allowRaise, allowLink);
    }

    if (!_.isFunction(setupCallback)) {
        throw new Error('setupCallback must be a function');
    }

    this.onSetup = noop;
    this.onRun = noop;
    this.onPause = noop;
    this.params = {};
    this.allowRaise = allowRaise;
    this.allowLink = allowLink;

    const setupContext = {
        require: (id) => {
            if (!_.isNil(this.params[id])) {
                throw new Error('required property apready defined.');
            }
        },
        define: (id, builder) => {
            if (!_.isNil(this.params[id])) {
                throw new Error('required property apready defined.');
            }

            if (_.isFunction(builder)) {
                this.params[id] = LogicDefinition(builder);
            } else {
                this.params[id] = builder;
            }
        },
        onSetup: (cb) => {
            if (!_.isFunction(cb)) {
                throw new Error('onSetup must be a function.');
            }

            this.onSetup = cb;
        },
        onRun: (cb) => {
            if (!_.isFunction(cb)) {
                throw new Error('onRun must be a function.');
            }

            this.onRun = cb;
        },
        onPause: (cb) => {
            if (!_.isFunction(cb)) {
                throw new Error('onPause must be a function.');
            }

            this.onPause = cb;
        },
    };

    setupCallback(setupContext);
}

LogicDefinition.prototype.buildContext = function buildContext(ruleContext) {
    const runContext = {};

    if (this.allowLink) {
        runContext.link = ruleContext.link.bind(ruleContext);
    }

    const owenerId = getId();

    if (this.allowRaise) {
        runContext.raise = ruleContext.raise.bind(ruleContext, owenerId);
        runContext.clear = ruleContext.clear.bind(ruleContext, owenerId);
    }

    const onSetup = this.onSetup.bind(null, runContext, ruleContext.tokenContext.contents);
    const onRun = this.onRun.bind(null, runContext, ruleContext.tokenContext.contents);
    const onPause = () => {
        this.onPause.call(null);

        runContext.clear();
    };

    const parametersContext = ParametersContext(ruleContext, this.params);

    return LogicContext(onSetup, onRun, onPause, parametersContext);
};

module.exports = LogicDefinition;
