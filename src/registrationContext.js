const _ = require('lodash');

function setAtScope(ruleContext, targetScope, id, value, paramStatus) {
    if (targetScope === '__working') {
        ruleContext.scope.parentScope.set(null, id, value, paramStatus, ruleContext);
    } else {
        ruleContext.scope.set(targetScope, id, value, paramStatus, ruleContext);
    }
}

function removeAtScope(ruleContext, targetScope, id) {
    if (targetScope === '__working') {
        ruleContext.scope.parentScope.remove(null, id, ruleContext);
    } else {
        ruleContext.scope.remove(targetScope, id, ruleContext);
    }
}

function RegistrationContext(ruleContext, registrations, owenerId) {
    if (!(this instanceof RegistrationContext)) {
        return new RegistrationContext(ruleContext, registrations, owenerId);
    }

    this.runStatus = 'stopped';
    this.contexts = [];

    const LogicDefinition = require('./logicDefinition'); // eslint-disable-line

    _.forOwn(registrations, (reg, id) => {
        if (reg.value instanceof LogicDefinition) {
            const logicContext = reg.value.buildContext(ruleContext, owenerId);

            logicContext.on('update', (paramStatus, value) => {
                if (paramStatus === 'ready') {
                    setAtScope(ruleContext, reg.atScope, id, value, paramStatus);
                } else {
                    removeAtScope(ruleContext, reg.atScope, id);
                }
            });

            this.contexts.push(logicContext);
        } else if (!_.isNil(reg.value)) {
            setAtScope(ruleContext, reg.atScope, id, reg.value, 'ready');

            this.contexts.push({
                start: () => {
                    setAtScope(ruleContext, reg.atScope, id, reg.value, 'ready');
                },
                stop: () => {
                    removeAtScope(ruleContext, reg.atScope, id);
                }
            });
        } else {
            throw new Error('Not implemented');
        }
    });
}

RegistrationContext.prototype.start = function start() {
    if (this.runStatus === 'started' || this.runStatus === 'starting') {
        return;
    }

    this.runStatus = 'starting';

    _.forEach(this.contexts, (context) => {
        context.start();
    });

    this.runStatus = 'started';
};

RegistrationContext.prototype.stop = function start() {
    if (this.runStatus === 'stopped' || this.runStatus === 'stopping') {
        return;
    }

    this.runStatus = 'stopping';

    _.forEach(this.contexts, (context) => {
        context.stop();
    });

    this.runStatus = 'stopped';
};

module.exports = RegistrationContext;
