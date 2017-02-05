const _ = require('lodash');

function LogicDefinition(id, onStart, onPause) {
    if (!(this instanceof LogicDefinition)) {
        return new LogicDefinition(id, onStart, onPause);
    }

    if (!_.isString(id) || id.length <= 0) {
        throw new Error('ID must be a string of length greater than 0');
    }

    this.id = id || Symbol('Internal');
    this.onStart = onStart;
    this.onPause = onPause;

    if (!_.isFunction(this.onPause)) {
        this.onPause = () => {});
    }
}

LogicDefinition.prototype.createContext = function createContext(context, tokenContext) {
    return LogicContext(this.id, context, tokenContext, this.onRun, this.onPause);
};

module.exports = LogicDefinition;
