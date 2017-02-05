function LogicContext(id, context, tokenContext, severity, onRun, onUnRun) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(id, context, tokenContext, severity, onRun, onUnRun);
    }

    this.id = id;
    this.context = context;
    this.tokenContext = tokenContext;
    this.severity = severity;
    this.onRun = onRun;
    this.onUnRun = onUnRun;
}

LogicContext.prototype.enable = function enable(severity) {
    if (_.isNil(severity)) {
        this.severity = 'error';
    } else {
        this.severity = severity;
    }
};

module.exports = LogicContext;
