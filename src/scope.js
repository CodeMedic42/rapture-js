const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');

function validateKey(key) {
    if (!_.isString(key)) {
        throw new Error('Key must be a string');
    }
}

function validateCallback(cb) {
    if (!_.isFunction(cb)) {
        throw new Error('Callback must be a function');
    }
}

function validateOwner(owner) {
    if (_.isNil(owner)) {
        throw new Error('Owner cannot be nil');
    }
}

function validateStatus(status) {
    if (!_.isBoolean(status)) {
        throw new Error('Status must be a boolean value');
    }
}

function setTarget(target, value, status, force) {
    const _target = target;

    const oldValue = _target.value;
    const oldStatus = _target.status;

    _target.value = value;
    _target.status = status;

    if (!force && (oldValue === _target.value) && (oldStatus === _target.status)) {
        // Nothing changes
        return null;
    }

    return _target;
}

function internalSet(key, value, ready, owner, force) {
    let target = this.data[key];
    const status = ready ? 'defined' : 'failing';

    if (_.isNil(target)) {
        // We have no value for this in memory at this scope.
        // Just set it no matter what.
        target = this.data[key] = { owner, value, status };

        return target;
    }

    if (owner === this.parentScope) {
        // parent scope is trying to set a value.

        if (target.owner === this.parentScope) {
            // parent is updating it's reference.

            return setTarget(target, value, status, force);
        }

        return null;
    } else if (owner === target.owner || target.owner === this.parentScope) {
        target.owner = owner;

        return setTarget(target, value, status, force);
    }

    throw new Error(`Cannot set duplicate value for "${key}"`);
}

function internalRemove(key, owner) {
    let target = this.data[key];

    if (_.isNil(target)) {
        return null;
    }

    if (owner === this.parentScope) {
        if (target.owner === this.parentScope) {
            // parent is removing it's reference.

            delete this.data[key];

            target.status = 'undefined';
            target.value = undefined;

            return target;
        }

        // parent is removing it's reference but the reference was overridden.
        // Nothing to do
        return null;
    } else if (owner === target.owner) {
        // Owner is removing it's reference

        const oldValue = target.value;
        const oldStatus = target.status;

        delete this.data[key];

        target.status = 'undefined';
        target.value = undefined;

        let parentData = null;

        if (!_.isNil(this.parentScope)) {
            // We need to check to see if a value by the same id exists in the partent.
            // If so we need to use that.
            parentData = this.parentScope.data[key];
        }

        if (!_.isNil(parentData)) {
            target = internalSet.call(this, key, parentData.value, parentData.status === 'defined', this.parentScope);

            if ((oldValue === target.value) && (oldStatus === target.status)) {
                // Nothing actualy changed about the data.
                return null;
            }
        }

        return target;
    } else if (target.owner === this.parentScope) {
        // This was set by our parent, we cannot remove it.
        throw new Error('Attempting to remove a value from the wrong scope');
    } else {
        throw new Error(`Only owner can remove ${key}`);
    }
}

function updateFromParent(parentData, force) {
    const updatedData = {};
    let updateAvaliable = false;

    _.forOwn(parentData, (data, key) => {
        let target;

        if (data.status === 'undefined') {
            target = internalRemove.call(this, key, this.parentScope);
        } else {
            target = internalSet.call(this, key, data.value, data.status === 'defined', this.parentScope, force);
        }

        if (!_.isNil(target)) {
            updatedData[key] = target;
            updateAvaliable = true;

            _.forEach(this.watches[key], (watch) => {
                // Due to the nature of this system it appears that it is possiblefor the watch to be pulled while we are in the middle of looping.
                // So we need to handle when the watch is null or undefined;
                if (!_.isNil(watch)) {
                    watch(target.status, target.value);
                }
            });
        }
    });

    if (updateAvaliable) {
        // we changed something
        this.emit('update', { data: updatedData, force });
    }
}

function internalInitalSet(id, key, value, ready, owner, force) {
    if (id !== this.id) {
        if (_.isNil(this.parentScope)) {
            throw new Error(`Scope "${id}" does not exist`);
        }

        return internalInitalSet.call(this.parentScope, id, key, value, ready, owner, force);
    }

    const target = internalSet.call(this, key, value, ready, owner, force);

    if (!_.isNil(target)) {
        // we changed something
        _.forEach(this.watches[key], (watch) => {
            watch(target.status, target.value);
        });

        this.emit('update', { data: { [key]: target }, force });
    }

    return target;
}

function internalInitalRemove(id, key, owner) {
    if (id !== this.id) {
        if (_.isNil(this.parentScope)) {
            throw new Error(`Scope "${id}" does not exist`);
        }

        internalInitalRemove.call(this.parentScope, id, key, owner);

        return;
    }

    const target = internalRemove.call(this, key, owner);

    if (!_.isNil(target)) {
        // we changed something
        _.forEach(this.watches[key], (watch) => {
            watch(target.status, target.value);
        });

        this.emit('update', { data: { [key]: target } });
    }
}

function Scope(id, parentScope) {
    if (!(this instanceof Scope)) {
        return new Scope(id, parentScope);
    }

    if (_.isNil(id)) {
        this.id = null;
    } else if (_.isString(id)) {
        this.id = id;
    } else {
        throw new Error('When defined id must be a string');
    }

    this.data = {};
    this.watches = {};

    EventEmitter.call(this);

    if (!_.isNil(parentScope)) {
        if (!(parentScope instanceof Scope)) {
            throw new Error('When defined parentScope must be an instance of Scope');
        }

        this.parentScope = parentScope;

        const parentCB = (update) => {
            updateFromParent.call(this, update.data, update.force);
        };

        this.parentScope.on('update', parentCB);

        this.disposeParentConnection = () => {
            this.parentScope.removeListener('update', parentCB);

            this.parentScope = null;
        };

        updateFromParent.call(this, this.parentScope.data, false);
    } else {
        this.parentScope = null;
    }
}

Util.inherits(Scope, EventEmitter);

Scope.prototype.dispose = function dispose() {
    _.forOwn(this.watches, (watcheCallbacks, name) => {
        if (_.isNil(this.data[name])) {
            return;
        }

        _.forEach(watcheCallbacks, (callback) => {
            callback('undefined', undefined);
        });

        this.watches[name] = null;
    });

    _.forOwn(this.data, (item, name) => {
        this.data[name] = null;
    });

    if (!_.isNil(this.parentScope)) {
        this.disposeParentConnection();
    }

    this.data = null;
    this.watches = null;

    this.emit('disposed');
};

Scope.prototype.set = function set(id, key, value, status, owner, force) {
    validateOwner(owner);
    validateKey(key);
    validateStatus(status);

    let _id = id;

    if (_.isNil(_id)) {
        _id = this.id;
    } else if (!_.isString(_id)) {
        throw new Error('When defined the id must be a string');
    }

    internalInitalSet.call(this, _id, key, value, status, owner, !!force);
};

Scope.prototype.get = function get(key) {
    validateKey(key);

    return this.data[key];
};

Scope.prototype.remove = function remove(id, key, owner) {
    validateOwner(owner);
    validateKey(key);

    let _id = id;

    if (!_.isNil(id)) {
        if (!_.isString(id)) {
            throw new Error('When defined the id must be a string');
        }
    } else {
        _id = this.id;
    }

    internalInitalRemove.call(this, _id, key, owner);
};

Scope.prototype.watch = function watch(key, cb) {
    validateKey(key);
    validateCallback(cb);

    const watches = this.watches[key] = this.watches[key] || [];

    const watchCallback = cb;

    watches.push(watchCallback);

    const target = this.data[key];

    if (_.isNil(target)) {
        cb('undefined');
    } else {
        cb(target.status, target.value);
    }

    return () => {
        _.pull(watches, watchCallback);
    };
};

module.exports = Scope;
