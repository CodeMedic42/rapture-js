const _ = require('lodash');

const RegistrationContext = require('./registrationContext.js');
const ParametersContext = require('./parametersContext');
const LogicContext = require('./logicContext');

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

    if (this.params.length <= 0 && _.isNil(this.onRun)) {
        throw new Error('onRun has not been defined even though parameters have been.');
    }
}

LogicDefinition.prototype.buildContext = function buildContext(ruleContext, owenerId) {
    const runContext = {};

    runContext.buildContext = ruleContext.buildContext.bind(ruleContext);
    runContext.buildLogicContext = (logicDefinition) => {
        return logicDefinition.buildContext(ruleContext, owenerId);
    };

    runContext.raise = ruleContext.raise.bind(ruleContext, owenerId);
    runContext.clear = ruleContext.clear.bind(ruleContext, owenerId);

    const onSetup = _.isNil(this.onSetup) ? null : this.onSetup.bind(null, runContext, ruleContext.tokenContext.contents);

    const onRun = _.isNil(this.onRun) ? null : this.onRun.bind(null, runContext, ruleContext.tokenContext.contents);
    const onPause = (params) => {
        if (!_.isNil(this.onPause)) {
            this.onPause.call(null, runContext, ruleContext.tokenContext.contents, params);
        }

        runContext.clear();
    };

    const registrationContext = _.keys(this.registrations).length > 0 ?
        RegistrationContext(ruleContext, this.registrations, owenerId) : null;

    const parametersContext = _.keys(this.params).length > 0 ?
        ParametersContext(ruleContext, this.params, owenerId) : null;

    return LogicContext(onSetup, onRun, onPause, parametersContext, registrationContext);
};

module.exports = LogicDefinition;
