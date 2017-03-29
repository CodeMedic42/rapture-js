const _ = require('lodash');

const LogicContext = require('./logicContext.js');

function LogicDefinition(setupCallback, controledByPreviousState) {
    if (!(this instanceof LogicDefinition)) {
        return new LogicDefinition(setupCallback, controledByPreviousState);
    }

    if (!_.isFunction(setupCallback)) {
        throw new Error('setupCallback must be a function');
    }

    this.params = {};
    this.registrations = {};
    this.controledByPreviousState = controledByPreviousState;

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
        options: (options) => {
            this.options = options;
        }
    };

    setupCallback(setupContext);

    if (this.params.length <= 0 && _.isNil(this.onRun)) {
        throw new Error('onRun has not been defined even though parameters have been.');
    }
}

LogicDefinition.prototype.buildContext = function buildContext(ruleContext, previousContext) {
    return LogicContext(ruleContext, this.onSetup, this.onRun, this.onPause, this.onTeardown, this.params, previousContext, this.options);
};

module.exports = LogicDefinition;
