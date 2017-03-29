const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');

let _set;

function Observable(initalValue) {
    if (!(this instanceof Observable)) {
        return new Observable(initalValue);
    }

    EventEmitter.call(this);

    _set.call(this, initalValue);
}

Util.inherits(Observable, EventEmitter);

const _emitChangeDub = function _emitChangeDubed() {
    this.emit('change', this);
};

function _emitChange(force) {
    if (this.status === 'started' || force) {
        _emitChangeDub.call(this);
    } else {
        this.status = 'emitRequired';
    }
}

function _link(observable) {
    observable.on('change', _emitChange, this);

    this.status = 'emitRequired';
}

function _unlink(observable) {
    observable.removeListener('change', _emitChange, this);

    this.status = 'emitRequired';
}

function _setAsObject(value) {
    const newData = {};
    let currentData = this.value;

    if (!_.isPlainObject(this.value)) {
        currentData = newData;

        if (_.isArray(this.value)) {
            _.forEach(this.value, (item) => {
                _unlink.call(this, item);
            });
        }

        this.status = 'emitRequired';
    }

    _.forOwn(value, (newChild, key) => {
        const existingChild = currentData[key];

        newData[key] = existingChild;

        if (existingChild === newChild) {
            // already has it's value
            return;
        }

        if (newChild instanceof Observable) {
            if (_.isNil(existingChild)) {
                newData[key] = newChild;

                _link.call(this, newChild);
            } else {
                existingChild.merge(newChild);
            }

            return;
        }

        if (_.isNil(existingChild)) {
            const child = newData[key] = new Observable(newChild);

            _link.call(this, child);
        } else {
            existingChild.set(newChild);
        }
    });

    if (_.isPlainObject(this.value)) {
        _.forOwn(this.value, (item, name) => {
            if (_.isNil(newData[name])) {
                _unlink.call(this, item);
            }
        });
    }

    this.value = newData;
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

        if (newChild instanceof Observable) {
            if (_.isNil(existingChild)) {
                newData[key] = newChild;

                _link.call(this, newChild);
            } else {
                existingChild.merge(newChild);
            }

            return;
        }

        if (_.isNil(existingChild)) {
            const child = newData[key] = new Observable(newChild);

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
}

function _setAsSimple(value) {
    if (value !== this.value) {
        this.value = value;

        this.status = 'emitRequired';
    }
}

_set = function __set(value) {
    this.status = 'updating';

    if (_.isPlainObject(value)) {
        _setAsObject.call(this, value);
    } else if (_.isArray(value)) {
        _setAsArray.call(this, value);
    } else {
        _setAsSimple.call(this, value);
    }

    if (this.status === 'emitRequired') {
        this.status = 'started';

        _emitChange.call(this);
    }
};

Observable.prototype.set = function set(...args) {
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

        finalTarget = new Observable(value);

        currentTarget.value[finalTargetPath] = finalTarget;

        _link(finalTarget);

        _emitChange.call(this, true);

        this.status = 'started';
    } else {
        _set.call(finalTarget, value);
    }
};

Observable.prototype.get = function get(...args) {
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

function toJSReducer(current, item, id) {
    const curr = current;

    curr[id] = item.toJS();

    return curr;
}

Observable.prototype.toJS = function toJS() {
    let data = this.value;

    if (_.isArray(data)) {
        data = _.reduce(data, toJSReducer, []);
    } else if (_.isPlainObject(data)) {
        data = _.reduce(data, toJSReducer, {});
    }

    return data;
};

Observable.prototype.manipulate = function manipulate(...args) {
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

Observable.prototype.pause = function pause() {
    this.status = 'paused';
};

Observable.prototype.unpause = function unpause() {
    this.status = 'started';
};

module.exports = Observable;
