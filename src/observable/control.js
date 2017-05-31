const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');

function load(observable, privateAccess) {
    let __Control;
    const __Observable = observable;

    function _getRemoveFunction() {
        if (this._type === 'object') {
            return function removeProperty(id) {
                delete this[id];
            };
        } else if (this._type === 'array') {
            return function removeItem(id) {
                _.pullAt(this, id);
            };
        }

        throw new Error('Not a valid type');
    }

    function _emit(force) {
        if (this._status.isUpdating && !force) {
            return;
        }

        if (this._status.changePending) {
            this._status.changePending = false;

            // Deep change
            this.emit('change');
        }

        if (this._status.updatePending) {
            this._status.updatePending = false;

            // Shallow change
            this.emit('update');
        }
    }

    function _linkControl(name, control) {
        const content = this._content[name];
        content.control = control;

        this._value[name] = content.control._value;

        this._status.changePending = true;
        this._status.updatePending = true;

        let changeListener = () => {
            this._value[name] = content.control._value;

            this._status.changePending = true;

            _emit.call(this);
        };

        let replaceListener = (replacement) => {
            content.disenguage();

            _linkControl.call(this, name, replacement);
        };

        content.disenguage = () => {
            this._status.updatePending = true;

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

            let control;

            if (item.control instanceof __Control) {
                control = item.control;
            } else if (item instanceof __Observable) {
                control = item[privateAccess].control;
            } else {
                control = __Control(item);
            }

            _linkControl.call(this, name, control);
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
        this._status.updatePending = true;
    }

    function _disengaugeCurrent() {
        if (this._type === 'simple') {
            return;
        }

        _.forEach(this._content, (item) => {
            item.disenguage();
        });
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

        _emit.call(this, true);

        this._status.isUpdating = false;
    }

    function _delete(id, use) {
        this._content[id].disenguage();

        use.call(this._content, id);
        use.call(this._value, id);
    }

    function _deleteValue(id) {
        if (this._type === 'simple') {
            throw new Error('Can only remove properties from object');
        }

        const use = _getRemoveFunction.call(this);

        _delete.call(this, id, use);
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
        _emit.call(this, true);

        if (replace) {
            data.emit('replace', this);
        }

        this._status.isUpdating = false;
    };

    __Control.prototype.set = function set(id, value) {
        this._status.isUpdating = true;

        _set.call(this, id, value);

        _emit.call(this, true);

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
        const result = _get.call(this, id);

        const target = result.targetControl._content[result.property];

        if (_.isNil(target)) {
            return;
        }

        try {
            this._status.isUpdating = true;

            _deleteValue.call(result.targetControl, result.property);

            _emit.call(this, true);
        } finally {
            this._status.isUpdating = false;
        }
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

        const use = _getRemoveFunction.call(this);

        _.forEach(toRemove, (id) => {
            _delete.call(this, id, use);
        });

        _emit.call(this, true);

        this._status.isUpdating = false;
    };

    __Control.prototype.push = function push(value) {
        if (this._type !== 'array') {
            throw new Error('Cannot use array functionality with a non-array item');
        }

        this.set(`${this._content.length}`, value);
    };

    return __Control;
}

module.exports = load;
