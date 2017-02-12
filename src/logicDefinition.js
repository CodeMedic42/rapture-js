const _ = require('lodash');

function LogicDefinition(onStart, onStop) {
    if (!(this instanceof LogicDefinition)) {
        return new LogicDefinition(onStart, onStop);
    }

    if (!_.isFunction(onStart)) {
        throw new Error('onStart function required.');
    }

    this.onStart = onStart;
    this.onStop = onStop;
}

// LogicDefinition.prototype.createContext = function createContext(context, tokenContext) {
//     return LogicContext(this.id, context, tokenContext, this.onRun, this.onPause);
// };

LogicDefinition.prototype.createRunContext = function createRunContext(ruleContext) {
    const runContext = {
        raise: ruleContext.raise.bind(ruleContext, this),
        clear: ruleContext.clear.bind(ruleContext, this)
    };

    ruleContext.on('start', this.onStart.bind(null, runContext, ruleContext.tokenContext.contents));
    ruleContext.on('stop', () => {
        if (!_.isNil(this.onStop)) {
            this.onStop(runContext, contents);
        }

        runContext.clear();
    });
    ruleContext.on('destroy', () => {
        runContext.clear();
    });
};



module.exports = LogicDefinition;
