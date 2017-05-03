const _ = require('lodash');

const LogicContext = require('./logicContext.js');

let Logic = null;

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

function validateOnTeardown(onTeardown) {
    if (!_.isNil(onTeardown) && !_.isFunction(onTeardown)) {
        throw new Error('onTeardown must be a function.');
    }

    this.onTeardown = onTeardown;
}

function checkForParam(id) {
    if (!_.isNil(this.params[id])) {
        throw new Error('required property apready defined.');
    }
}

function convertToFullRequiredObject(item) {
    if (_.isString(item)) {
        return { id: item, required: true, value: item };
    } else if (_.isPlainObject(item)) {
        if (_.isNil(item.id)) {
            throw new Error('id cannot be null');
        }

        const fullItem = {
            id: item.id,
            value: item.value,
            required: true
        };

        if (_.isNil(item.value)) {
            fullItem.value = item.id;
        } else if (!_.isString(item.value) && !(item.value instanceof Logic)) {
            throw new Error('Required item values must be strings or Rature logic objects');
        }

        return fullItem;
    }

    throw new Error('Required items must be strings or objects');
}

function convertToFullDefinedObject(item) {
    if (!_.isPlainObject(item)) {
        throw new Error('Defined items must be objects');
    }

    if (_.isNil(item.id)) {
        throw new Error('id cannot be null');
    }

    return {
        id: item.id,
        value: item.value,
        required: false
    };
}

function validateRequiredItems(requiredItems) {
    if (_.isNil(requiredItems)) {
        return;
    }

    if (_.isString(requiredItems) || _.isPlainObject(requiredItems)) {
        validateRequiredItems.call(this, [requiredItems]);

        return;
    }

    if (!_.isArray(requiredItems)) {
        throw new Error('Required items must either be a string or an array of strings.');
    }

    _.forEach(requiredItems, (item) => {
        const fullItem = convertToFullRequiredObject(item);

        checkForParam.call(this, fullItem.id);

        this.params[fullItem.id] = fullItem;
    });
}

function validateDefinededItems(definedItems) {
    if (_.isNil(definedItems)) {
        return;
    }

    if (_.isPlainObject(definedItems)) {
        validateDefinededItems.call(this, [definedItems]);

        return;
    }

    if (!_.isArray(definedItems)) {
        throw new Error('Required items must either be an object or an array of objects.');
    }

    _.forEach(definedItems, (item) => {
        const fullItem = convertToFullDefinedObject(item);

        checkForParam.call(this, fullItem.id);

        this.params[fullItem.id] = fullItem;
    });
}

Logic = function LogicDef(logicComponents) {
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
    validateOnTeardown.call(this, logicComponents.onTeardown);

    validateRequiredItems.call(this, logicComponents.require);
    validateDefinededItems.call(this, logicComponents.define);

    this.options = logicComponents.options || {};

    if (this.params.length <= 0 && _.isNil(this.onRun)) {
        throw new Error('onRun has not been defined even though parameters have been.');
    }
};

Logic.prototype.buildContext = function buildContext(ruleContext, previousContext) {
    return LogicContext(ruleContext, this.onSetup, this.onRun, this.onPause, this.onTeardown, this.params, previousContext, this.options);
};

module.exports = Logic;
