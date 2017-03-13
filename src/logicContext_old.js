function LogicContext(id, ruleContext, tokenContext, onRun, onPause) {
    if (!(this instanceof LogicContext)) {
        return new LogicContext(id, ruleContext, tokenContext, onRun, onPause);
    }

    this.id = id;
    this.ruleContext = ruleContext;
    this.tokenContext = tokenContext;
    this.onRun = onRun;
    this.onPause = onPause;
}

LogicContext.prototype.start = function start() {
    const result = this.onRun.call(this, this.tokenContext);

    this.ruleContext.set(this.id, result);
};

LogicContext.prototype.pause = function start() {
    this.onPause.call(this);

    this.ruleContext.set(this.id, null);
};

LogicContext.prototype.set = function set(issues) {
    this.ruleContext.set(this.id, issues);
};


module.exports = LogicContext;
