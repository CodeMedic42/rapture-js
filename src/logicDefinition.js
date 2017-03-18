const _ = require('lodash');

const RegistrationContext = require('./registrationContext.js');
const ParametersContext = require('./parametersContext');
const LogicContext = require('./logicContext');

let currentId = 0;

function getId() {
    currentId = currentId += 1;

    return currentId;
}

function LogicDefinition(setupCallback, allowRaise, allowChildren) {
    if (!(this instanceof LogicDefinition)) {
        return new LogicDefinition(setupCallback, allowRaise, allowChildren);
    }

    if (!_.isFunction(setupCallback)) {
        throw new Error('setupCallback must be a function');
    }

    this.params = {};
    this.registrations = {};
    this.allowRaise = allowRaise;
    this.allowChildren = allowChildren;

    const setupContext = {
        require: (id) => {
            this.params[id] = null;
        },
        register: (id, atScope, builder) => {
            this.registrations[id] = {
                atScope,
                value: _.isFunction(builder) ? LogicDefinition(builder) : builder
            };

            setupContext.require(id);
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

    if (this.allowChildren) {
        runContext.buildContext = ruleContext.buildContext.bind(ruleContext);
    }

    const owenerId = getId();

    if (this.allowRaise) {
        runContext.raise = ruleContext.raise.bind(ruleContext, owenerId);
        runContext.clear = ruleContext.clear.bind(ruleContext, owenerId);
    }

    const onSetup = _.isNil(this.onSetup) ? null : this.onSetup.bind(null, runContext, ruleContext.tokenContext.contents);
    const onRun = _.isNil(this.onRun) ? null : this.onRun.bind(null, runContext, ruleContext.tokenContext.contents);
    const onPause = (params) => {
        if (!_.isNil(this.onPause)) {
            this.onPause.call(null, runContext, ruleContext.tokenContext.contents, params);
        }

        runContext.clear();
    };

    const registrationContext = RegistrationContext(ruleContext, this.registrations);
    const parametersContext = ParametersContext(ruleContext, this.params);

    return LogicContext(onSetup, onRun, onPause, parametersContext, registrationContext);
};

module.exports = LogicDefinition;
