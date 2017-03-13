const _ = require('lodash');

function noop() {}

function RunDataContext(setupCallback) {
    if (!(this instanceof RunDataContext)) {
        return new RunDataContext(setupCallback);
    }

    if (!_.isFunction(setupCallback)) {
        throw new Error('setupCallback must be a function');
    }

    this.required = {};
    this.onStart = noop;
    this.onStop = noop;

    const setupContext = {
        require: (id, builder) => {
            if (!_.isNil(this.required[id])) {
                throw new Error('required property apready defined.');
            }

            this.required[id] = builder;
        },
        onStart: (cb) => {
            if (!_.isFunction(cb)) {
                throw new Error('onStart must be a function.');
            }

            this.onStart = cb;
        },
        onStop: (cb) => {
            if (!_.isFunction(cb)) {
                throw new Error('onStop must be a function.');
            }

            this.onStop = cb;
        },
    };

    setupCallback(setupContext);
}

module.exports = RunDataContext;
