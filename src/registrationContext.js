const _ = require('lodash');

function setAtScope(ruleContext, targetScope, id, value, paramStatus) {
    let _targetScope = targetScope;

    if (_targetScope === '__working') {
        _targetScope = null;
    }

    ruleContext.scope.set(_targetScope, id, value, paramStatus, ruleContext);
}

function RegistrationContext(ruleContext, registrations) {
    if (!(this instanceof RegistrationContext)) {
        return new RegistrationContext(ruleContext, registrations);
    }

    this.runStatus = 'stopped';
    this.contexts = [];

    const LogicDefinition = require('./logicDefinition'); // eslint-disable-line

    _.forOwn(registrations, (reg, id) => {
        if (reg.value instanceof LogicDefinition) {
            const logicContext = reg.value.buildContext(ruleContext);

            logicContext.on('update', (paramStatus, value) => {
                setAtScope(ruleContext, reg.atScope, id, value, paramStatus);
            });

            this.contexts.push(logicContext);
        } else if (!_.isNil(reg.value)) {
            setAtScope(ruleContext, reg.atScope, id, reg.value, 'ready');

            this.contexts.push({
                start: () => ruleContext.scope.set.bind(reg.atScope, id, reg.value, 'ready', ruleContext),
                stop: () => ruleContext.scope.remove.bind(reg.atScope, id, ruleContext)
            });
        } else {
            throw new Error('Not implemented');
        }
    });
}

RegistrationContext.prototype.start = function start() {
    this.runStatus = 'starting';

    _.forEach(this.contexts, (context) => {
        context.start();
    });

    this.runStatus = 'started';
};

RegistrationContext.prototype.stop = function start() {
    this.runStatus = 'stopping';

    _.forEach(this.contexts, (context) => {
        context.stop();
    });

    this.runStatus = 'stopped';
};

module.exports = RegistrationContext;
