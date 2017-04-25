const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');

let _Observable = null;

function _emitChange(force) {
    if (this.status === 'started' || force) {
        this.emit('change');

        return;
    }

    this.status = 'emitRequired';
}

function _link(observable) {
    observable.on('change', _emitChange, this);

    this.status = 'emitRequired';
}

function _unlink(observable) {
    observable.removeListener('change', _emitChange, this);

    this.status = 'emitRequired';
}

function _arrayUpdateAdd(newValue, cb) {
    this.status = 'updating';

    let newValueOb = newValue;

    if (!(newValue instanceof _Observable)) {
        newValueOb = new _Observable(newValue);
    }

    cb(newValueOb);

    _link.call(this, newValueOb);

    _emitChange.call(this, true);

    this.status = 'started';
}

function _arrayUpdateRemove(cb) {
    this.status = 'updating';

    const items = cb();

    if (items.length > 0) {
        _.forEach(items, (item) => {
            _unlink.call(this, item);
        });

        _emitChange.call(this, true);
    }

    this.status = 'started';
}

function _push(newValue) {
    _arrayUpdateAdd.call(this, newValue, (newValueOb) => {
        this.value.push(newValueOb);
    });
}

function _unshift(newValue) {
    _arrayUpdateAdd.call(this, newValue, (newValueOb) => {
        this.value.unshift(newValueOb);
    });
}

function _remove(cb) {
    _arrayUpdateRemove.call(this, () => {
        return _.remove(this.value, (item) => {
            return cb(item.toJS());
        });
    });
}

function _pop() {
    _arrayUpdateRemove.call(this, () => {
        const item = this.value.pop();

        if (_.isNil(item)) {
            return [];
        }

        return [item];
    });
}

function _shift() {
    _arrayUpdateRemove.call(this, () => {
        const item = this.value.shift();

        if (_.isNil(item)) {
            return [];
        }

        return [item];
    });
}

function _addArrayProperies(target) {
    const _target = target;

    _target.push = _push;
    _target.pop = _pop;
    _target.remove = _remove;
    _target.shift = _shift;
    _target.unshift = _unshift;
}

function _removeArrayProperies(target) {
    const _target = target;

    delete _target.push;
    delete _target.pop;
    delete _target.remove;
    delete _target.shift;
    delete _target.unshift;
}

function _setAsObject(newValue) {
    const newData = {};

    let currentValue = this.value;

    if (!_.isPlainObject(currentValue)) {
        if (_.isArray(currentValue)) {
            _.forEach(currentValue, (item) => {
                _unlink.call(this, item);
            });
        }

        currentValue = {};

        this.status = 'emitRequired';
    }

    _.forOwn(newValue, (newChild, key) => {
        const existingChild = currentValue[key];

        newData[key] = existingChild;

        if (existingChild === newChild) {
            // already has it's value
            return;
        }

        if (newChild instanceof _Observable) {
            if (_.isNil(existingChild)) {
                newData[key] = newChild;

                _link.call(this, newChild);
            } else {
                existingChild.merge(newChild);
            }

            return;
        }

        if (_.isNil(existingChild)) {
            const child = newData[key] = new _Observable(newChild);

            _link.call(this, child);
        } else {
            existingChild.set(newChild);
        }
    });

    _.forOwn(currentValue, (item, name) => {
        if (_.isNil(newData[name])) {
            _unlink.call(this, item);
        }
    });

    this.value = newData;

    this.runningType = 'object';
}

function _setAsArray(value) {
    const newData = [];
    let currentData = this.value;

    if (!_.isArray(this.value)) {
        currentData = newData;

        if (_.isPlainObject(this.value)) {
            _.forOwn(this.value, (item) => {
                _unlink.call(this, item);
            });
        }

        this.status = 'emitRequired';
    }

    _.forEach(value, (newChild, key) => {
        const existingChild = currentData[key];

        newData[key] = existingChild;

        if (existingChild === newChild) {
            // already has it's value
            return;
        }

        if (newChild instanceof _Observable) {
            if (_.isNil(existingChild)) {
                newData[key] = newChild;

                _link.call(this, newChild);
            } else {
                existingChild.merge(newChild);
            }

            return;
        }

        if (_.isNil(existingChild)) {
            const child = newData[key] = new _Observable(newChild);

            _link.call(this, child);
        } else {
            existingChild.set(newChild);
        }
    });

    if (_.isArray(this.value)) {
        while (this.value.length > newData.length) {
            const item = this.value.pop();

            _unlink.call(this, item);
        }
    }

    this.value = newData;

    _addArrayProperies(this);

    this.runningType = 'array';
}

function _setAsSimple(value) {
    if (value !== this.value) {
        this.value = value;

        this.runningType = 'simple';

        this.status = 'emitRequired';
    }
}

function _set(value) {
    this.status = 'updating';

    if (_.isPlainObject(value)) {
        _removeArrayProperies(this);

        _setAsObject.call(this, value);
    } else if (_.isArray(value)) {
        _setAsArray.call(this, value);
    } else {
        _removeArrayProperies(this);

        _setAsSimple.call(this, value);
    }

    if (this.status === 'emitRequired') {
        this.status = 'started';

        _emitChange.call(this);
    }
}

function _toJSReducer(current, item, id) {
    const curr = current;

    curr[id] = item.toJS();

    return curr;
}

_Observable = function Observable(initalValue) {
    if (!(this instanceof Observable)) {
        return new Observable(initalValue);
    }

    EventEmitter.call(this);

    _set.call(this, initalValue);
};

Util.inherits(_Observable, EventEmitter);

_Observable.prototype.set = function set(...args) {
    if (args.length <= 0) {
        throw new Error('Need a value');
    } else if (args.length === 1) {
        this.set('', args[0]);

        return;
    }

    const path = args[0];
    const value = args[1];

    const fullPath = _.toPath(path);
    const finalTargetPath = fullPath.pop();

    if (_.isNil(finalTargetPath)) {
        _set.call(this, value);

        return;
    }

    let currentTarget = this;
    let rebuiltPath = '';

    _.forEach(fullPath, (pathPart) => {
        rebuiltPath = `${rebuiltPath}.${pathPart}`;

        currentTarget = currentTarget.value[pathPart];

        if (_.isNil(currentTarget)) {
            throw new Error(`${rebuiltPath} is null or undefined`);
        }
    });

    let finalTarget = currentTarget.value[finalTargetPath];

    if (_.isNil(finalTarget)) {
        this.status = 'updating';

        finalTarget = new _Observable(value);

        currentTarget.value[finalTargetPath] = finalTarget;

        _link.call(this, finalTarget);

        _emitChange.call(this, true);

        this.status = 'started';
    } else {
        _set.call(finalTarget, value);
    }
};

_Observable.prototype.get = function get(...args) {
    if (args.length <= 0) {
        return this.get('');
    }

    const path = args[0];

    const fullPath = _.toPath(path);
    const finalTargetPath = fullPath.pop();

    if (_.isNil(finalTargetPath)) {
        return this.value;
    }

    let currentTarget = this.value;
    let rebuiltPath = '';

    _.forEach(fullPath, (pathPart) => {
        rebuiltPath = `${rebuiltPath}.${pathPart}`;

        currentTarget = currentTarget[pathPart];

        if (_.isNil(currentTarget)) {
            throw new Error(`${rebuiltPath} is null or undefined`);
        }

        currentTarget = currentTarget.value;
    });

    return currentTarget[finalTargetPath];
};

_Observable.prototype.toJS = function toJS() {
    let data = this.value;

    if (_.isArray(data)) {
        data = _.reduce(data, _toJSReducer, []);
    } else if (_.isPlainObject(data)) {
        data = _.reduce(data, _toJSReducer, {});
    }

    return data;
};

_Observable.prototype.manipulate = function manipulate(...args) {
    if (args.length <= 0) {
        throw new Error('Must provide a callback');
    } else if (args.length === 1) {
        this.manipulate('', args[0]);
        return;
    } else if (!_.isString(args[0])) {
        throw new Error('path must be a string');
    } else if (!_.isFunction(args[1])) {
        throw new Error('callback must be a function');
    }

    const path = args[0];
    const manipulator = args[1];

    let current;

    if (path === '') {
        current = this.toJS();
    } else {
        current = this.get(path);

        if (!_.isNil(current)) {
            current = current.toJS();
        }
    }

    const newValue = manipulator(current);

    this.set(path, newValue);
};

_Observable.prototype.pause = function pause() {
    this.status = 'paused';
};

_Observable.prototype.unpause = function unpause() {
    this.status = 'started';
};

module.exports = _Observable;
