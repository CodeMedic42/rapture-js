const _ = require('lodash');

const LogicContext = require('./logicContext');

function noop() {}

function LogicDefinition(setupCallback) {
    if (!(this instanceof LogicDefinition)) {
        return new LogicDefinition(setupCallback);
    }

    if (!_.isFunction(setupCallback)) {
        throw new Error('setupCallback must be a function');
    }

    this.needsLoaded = {};
    this.onRun = noop;
    this.onPause = noop;

    const setupContext = {
        require: (id) => {
            throw new Error('setupContext.require not implemented yet.');
        },
        define: (id, builder) => {
            if (!_.isNil(this.needsLoaded[id]) || !_.isNil(this.params[id])) {
                throw new Error('required property apready defined.');
            }

            if (_.isFunction(builder)) {
                this.needsLoaded[id] = LogicDefinition(builder);
            } else {
                this.params[id] = builder;
            }

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
    const runContext = {
        link: ruleContext.link.bind(ruleContext)
    };

    if (allowRaise) {
        this.runContext.raise = ruleContext.raise.bind(ruleContext, this);
        this.runContext.clear = ruleContext.clear.bind(ruleContext, this);
    }

    const logicContext = LogicContext({
        
    }, this.onRun, this.onPause, this.params, false);

    ruleContext.on('start', () => {
        logicContext.start();
    });

    ruleContext.on('stop', () => {
        logicContext.stop();
    });
};

// LogicDefinition.prototype.createRunContext = function createRunContext(ruleContext) {
//     const logicContext
//
//     _.forOwn(this.needsLoaded, (ned) => {
//         ned.createRunContext(ruleContext);
//     });
//
//     const runContext = {
//         raise: ruleContext.raise.bind(ruleContext, this),
//         clear: ruleContext.clear.bind(ruleContext, this),
//         link: ruleContext.link.bind(ruleContext),
//         params: this.params
//     };
//
//     ruleContext.on('start', () => {
//         const ret = this.onRun.call(null, runContext, ruleContext.tokenContext.contents);
//     });
//     ruleContext.on('stop', () => {
//         this.onPause(runContext, contents);
//
//         runContext.clear();
//     });
//     ruleContext.on('destroy', () => {
//         runContext.clear();
//     });
// };

module.exports = LogicDefinition;
