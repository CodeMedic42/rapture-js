const _ = require('lodash');

const _LogicContext = require('./logicContext.js');

let _Logic = null;

function validateCallback(components, name) {
    if (!_.isNil(components[name]) && !_.isFunction(components[name])) {
        throw new Error(`${name} must be a function.`);
    }

    this.callbacks[name] = components[name];
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
        } else if (!_.isString(item.value) && !(item.value instanceof _Logic)) {
            throw new Error('Required item values must be strings or Rature _Logic objects');
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

function validateDefinedItems(definedItems) {
    if (_.isNil(definedItems)) {
        return;
    }

    if (_.isPlainObject(definedItems)) {
        validateDefinedItems.call(this, [definedItems]);

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

_Logic = function Logic(controlType, components) {
    if (!(this instanceof _Logic)) {
        return new Logic(controlType, components);
    }

    if (!_.isPlainObject(components)) {
        throw new Error('logicComponents must be an object');
    }

    this.id = components.id;
    this.controlType = controlType;
    this.params = {};
    this.callbacks = {};

    validateCallback.call(this, components, 'onBuild');
    validateCallback.call(this, components, 'onStart');
    validateCallback.call(this, components, 'onValid');
    validateCallback.call(this, components, 'onInvalid');
    validateCallback.call(this, components, 'onStop');
    validateCallback.call(this, components, 'onDispose');

    validateRequiredItems.call(this, components.require);
    validateDefinedItems.call(this, components.define);

    this.options = components.options || {};
};

_Logic.prototype.buildContext = function buildContext(name, ruleContext, previousContext) {
    return _LogicContext({
        name,
        id: this.id,
        controlType: this.controlType,
        previous: previousContext,
        parent: ruleContext
    },
    this.callbacks,
    this.params,
    this.options);
};

module.exports = _Logic;
