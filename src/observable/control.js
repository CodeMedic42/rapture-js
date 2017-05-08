const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');

let __Control;

function _emitChange(force) {
    if (!this._status.changePending) {
        return;
    }

    if (!this._status.isUpdating || force) {
        this._status.changePending = false;

        this.emit('change');
    }
}

function _linkControl(name, control) {
    const content = this._content[name];
    content.control = control;

    this._value[name] = content.control._value;

    let changeListener = () => {
        this._value[name] = content.control._value;

        this._status.changePending = true;

        _emitChange.call(this);
    };

    let replaceListener = (replacement) => {
        content.disenguage();

        _linkControl.call(this, name, replacement);
    };

    content.disenguage = () => {
        content.control.removeListener('change', changeListener);
        content.control.removeListener('replace', replaceListener);

        changeListener = null;
        replaceListener = null;
        content.disenguage = null;
        content.control = null;
    };

    content.control.on('change', changeListener);
    content.control.on('replace', replaceListener);
}

function _setupObject(item, name) {
    let content = this._content[name];

    if (_.isNil(content)) {
        content = this._content[name] = {};
        const control = item.control instanceof __Control ? item.control : __Control(item);

        _linkControl.call(this, name, control);
        this._status.changePending = true;
    } else {
        const updateWith = !_.isNil(item) && item.control instanceof __Control ? item.control : item;

        content.control.update(updateWith);
    }
}

function _setAsObject(newData) {
    _.forOwn(this._content, (existingItem, name) => {
        if (!_.isNil(newData[name])) {
            return;
        }

        existingItem.disenguage();

        delete this._content[name];
    });

    _.forOwn(newData, _setupObject.bind(this));
}

function _setAsArray(newData) {
    while (this._content.length > newData.length) {
        this._content.pop().disenguage();

        this._status.changePending = true;
    }

    _.forEach(newData, _setupObject.bind(this));
}

function _setAsSimple(newData) {
    if (_.isEqual(newData, this._content)) {
        return;
    }

    this._content = newData;
    this._value = newData;
    this._status.changePending = true;
}

function _disengaugeCurrent() {
    if (this._type === 'simple') {
        return;
    }

    _.forEach(this._content, (item) => {
        item.disenguage();
    });

    this._status.changePending = true;
}

function _setContent(newData) {
    if (_.isPlainObject(newData)) {
        if (this._type !== 'object') {
            _disengaugeCurrent.call(this);

            this._content = {};
            this._value = {};
            this._type = 'object';
        }

        _setAsObject.call(this, newData);
    } else if (_.isArray(newData)) {
        if (this._type !== 'array') {
            _disengaugeCurrent.call(this);

            this._content = [];
            this._value = [];
            this._type = 'array';
        }

        _setAsArray.call(this, newData);
    } else if (!_.isObject(newData) || _.isDate(newData)) {
        if (this._type !== 'simple') {
            _disengaugeCurrent.call(this);

            this._type = 'simple';
        }

        _setAsSimple.call(this, newData);
    } else {
        throw new Error('Did not exepct this object.');
    }
}

__Control = function Control(...args) {
    if (!(this instanceof __Control)) {
        return new __Control(...args);
    }

    EventEmitter.call(this);

    this._status = {
        changePending: false
    };

    _setContent.call(this, args[0]);

    this._status.changePending = false;
};

Util.inherits(__Control, EventEmitter);

__Control.prototype.update = function update(data) {
    if (data === this) {
        return;
    }

    this._status.isUpdating = true;

    const replace = data instanceof __Control;
    const newData = replace ? data._content : data;

    _setContent.call(this, newData);

    // emit before replacing to keep incoming controls from firing.
    _emitChange.call(this, true);

    if (replace) {
        data.emit('replace', this);
    }

    this._status.isUpdating = false;
};

function _addProperty(id, value) {
    if (this._type === 'simple') {
        throw new Error('Can only add properties to object');
    }

    this._status.isUpdating = true;
    this._content[id] = {};

    if (value instanceof __Control) {
        _linkControl.call(this, id, value);
    } else {
        _linkControl.call(this, id, __Control(value));
    }

    this._status.changePending = true;

    _emitChange.call(this, true);

    this._status.isUpdating = false;
}

function _removeProperty(id) {
    if (this._type === 'simple') {
        throw new Error('Can only remove properties from object');
    }

    const target = this._content[id];

    if (_.isNil(target)) {
        return;
    }

    this._status.isUpdating = true;

    target.disenguage();

    this._status.changePending = true;

    _emitChange.call(this, true);

    this._status.isUpdating = false;
}

function _get(id) {
    const fullPath = _.toPath(id);
    const finalProperty = fullPath.pop();

    let targetControl = this;
    let rebuiltPath = '';

    _.forEach(fullPath, (pathPart) => {
        rebuiltPath = `${rebuiltPath}.${pathPart}`;

        targetControl = targetControl._content[pathPart];

        if (_.isNil(targetControl)) {
            throw new Error(`${rebuiltPath} is null or undefined`);
        }

        targetControl = targetControl.control;
    });

    return {
        targetControl,
        property: finalProperty
    };
}

function _set(id, value) {
    let targetControl;

    if (_.isNil(id) || id === '') {
        targetControl = this;
    } else if (_.isString(id)) {
        const result = _get.call(this, id);

        targetControl = result.targetControl._content[result.property];

        if (_.isNil(targetControl)) {
            _addProperty.call(result.targetControl, result.property, value);

            return;
        }

        targetControl = targetControl.control;
    } else {
        throw new Error('Id must be a string');
    }

    targetControl.update(value);
}

__Control.prototype.set = function set(id, value) {
    this._status.isUpdating = true;

    _set.call(this, id, value);

    _emitChange.call(this, true);

    this._status.isUpdating = false;
};

__Control.prototype.get = function get(id) {
    const result = _get.call(this, id);

    const target = result.targetControl._content[result.property];

    if (_.isNil(target)) {
        return target;
    }

    return target.control;
};

__Control.prototype.delete = function delete_(id) {
    this._status.isUpdating = true;

    _removeProperty.call(this, id);

    _emitChange.call(this, true);

    this._status.isUpdating = false;
};

__Control.prototype.remove = function remove(cb) {
    if (this._type === 'simple') {
        throw new Error('Do not use remove with a simple type');
    }

    this._status.isUpdating = true;

    const toRemove = [];

    _.forEach(this._value, (item, name) => {
        if (cb(item, name)) {
            toRemove.push(name);
        }
    });

    let use;

    if (this._type === 'object') {
        use = function removeProperty(id) {
            delete this[id];
        };
    } else if (this._type === 'array') {
        use = function removeItem(id) {
            _.pullAt(this, id);
        };
    }

    _.forEach(toRemove, (id) => {
        this._status.changePending = true;

        this._content[id].disenguage();

        use.call(this._content, id);
        use.call(this._value, id);
    });

    _emitChange.call(this, true);

    this._status.isUpdating = false;
};

__Control.prototype.push = function push(value) {
    if (this._type !== 'array') {
        throw new Error('Cannot use array functionality with a non-array item');
    }

    this.set(`${this._content.length}`, value);
};

module.exports = __Control;
