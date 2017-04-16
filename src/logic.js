const _ = require('lodash');

const LogicContext = require('./logicContext.js');

function validateOnSetup(onSetup) {
    if (!_.isNil(onSetup) && !_.isFunction(onSetup)) {
        throw new Error('onSetup must be a function.');
    }

    this.onSetup = onSetup;
}

function validateOnRun(onRun) {
    if (!_.isNil(onRun) && !_.isFunction(onRun)) {
        throw new Error('onRun must be a function.');
    }

    this.onRun = onRun;
}

function validateOnPause(onPause) {
    if (!_.isNil(onPause) && !_.isFunction(onPause)) {
        throw new Error('onPause must be a function.');
    }

    this.onPause = onPause;
}

function checkForParam(id) {
    if (!_.isNil(this.params[id])) {
        throw new Error('required property apready defined.');
    }
}

function validateRequiredItems(requiredItems) {
    if (_.isNil(requiredItems)) {
        return;
    }

    if (_.isString(requiredItems)) {
        checkForParam.call(this, requiredItems);

        this.params[requiredItems] = null;

        return;
    }

    if (_.isArray(requiredItems)) {
        _.forEach(requiredItems, (item) => {
            validateRequiredItems.call(this, item);
        });

        return;
    }

    throw new Error('Required items must either be a string or an array of strings.');
}

function validateDefinededItems(defined) {
    if (_.isNil(defined)) {
        return;
    }

    if (_.isPlainObject(defined)) {
        if (!_.isString(defined.id)) {
            throw new Error('The id must be a string');
        }

        checkForParam.call(this, defined.id);

        this.params[defined.id] = defined.value;

        return;
    }

    if (_.isArray(defined)) {
        _.forEach(defined, (item) => {
            validateDefinededItems.call(this, item);
        });

        return;
    }

    throw new Error('Defined items must either be a plainObject or an array of plainObjects.');
}

function Logic(logicComponents) {
    if (!(this instanceof Logic)) {
        return new Logic(logicComponents);
    }

    if (!_.isPlainObject(logicComponents)) {
        throw new Error('logicComponents must be a an object');
    }

    this.params = {};

    validateOnSetup.call(this, logicComponents.onSetup);
    validateOnRun.call(this, logicComponents.onRun);
    validateOnPause.call(this, logicComponents.onPause);

    validateRequiredItems.call(this, logicComponents.require);
    validateDefinededItems.call(this, logicComponents.define);

    this.options = logicComponents.options || {};

    if (this.params.length <= 0 && _.isNil(this.onRun)) {
        throw new Error('onRun has not been defined even though parameters have been.');
    }
}

Logic.prototype.buildContext = function buildContext(ruleContext, previousContext) {
    return LogicContext(ruleContext, this.onSetup, this.onRun, this.onPause, this.onTeardown, this.params, previousContext, this.options);
};

module.exports = Logic;
