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

function internalSet(key, value, ready, owner) {
    let target = this.data[key];
    const status = ready ? 'ready' : 'failed';

    if (_.isNil(target)) {
        // We have no value for this in memory at this scope.
        // Just set it no matter what.
        target = this.data[key] = { owner, value, status };
    } else {
        const oldValue = target.value;
        const oldStatus = target.status;

        if (_.isNil(target.owner)) {
            // origial was set by parent, we can override this value no matter what
            target.value = value;
            target.status = status;
            target.owner = owner;
        } else if (!_.isNil(owner)) {
            if (owner === target.owner) {
                // The owner is changing this value
                target.value = value;
                target.status = status;
            } else {
                // This value is being updated by someone else and this cannot be allowed.
                throw new Error(`Cannot set duplicate value for "${key}"`);
            }
        }

        if ((oldValue === target.value) && (oldStatus === target.status)) {
            // Nothing changes
            return null;
        }
    }

    return target;
}

function internalRemove(key, owner) {
    let target = this.data[key];

    if (_.isNil(target)) {
        return null;
    }

    if (_.isNil(target.owner) && !_.isNil(owner)) {
        // This was set by our parent, we cannot remove it.
        throw new Error('Attempting to remove a value from the wrong scope');
    } else if (target.owner !== owner) {
        throw new Error(`Only owner can remove ${key}`);
    }

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
        target = internalSet.call(this, key, parentData.value, parentData.status === 'ready', null);

        if ((oldValue === target.value) && (oldStatus === target.status)) {
            // Nothing actualy changed about the data.
            return null;
        }
    }

    return target;
}

function updateFromParent(parentData) {
    const updatedData = {};
    let updateAvaliable = false;

    _.forOwn(parentData, (data, key) => {
        let target;

        if (data.status === 'undefined') {
            target = internalRemove.call(this, key, null);
        } else {
            target = internalSet.call(this, key, data.value, data.status === 'ready', null);
        }

        if (!_.isNil(target)) {
            updatedData[key] = target;
            updateAvaliable = true;

            _.forEach(this.watches[key], (watch) => {
                watch(target.status, target.value);
            });
        }
    });

    if (updateAvaliable) {
        // we changed something
        this.emit('update', updatedData);
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

        const parentCB = (updatedData) => {
            updateFromParent.call(this, updatedData);
        };

        this.parentScope.on('update', parentCB);

        this.disposeParentConnection = () => {
            this.parentScope.removeListener('update', parentCB);

            this.parentScope = null;
        };

        updateFromParent.call(this, this.parentScope.data);
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

function internalInitalSet(id, key, value, ready, owner) {
    if (id !== this.id) {
        if (_.isNil(this.parentScope)) {
            throw new Error(`Scope "${id}" does not exist`);
        }

        return internalInitalSet.call(this.parentScope, id, key, value, ready, owner);
    }

    const target = internalSet.call(this, key, value, ready, owner);

    if (!_.isNil(target)) {
        // we changed something
        _.forEach(this.watches[key], (watch) => {
            watch(target.status, target.value);
        });

        this.emit('update', { [key]: target });
    }

    return target;
}

Scope.prototype.set = function set(id, key, value, status, owner) {
    validateOwner(owner);
    validateKey(key);
    validateStatus(status);

    let _id = id;

    if (_.isNil(_id)) {
        _id = this.id;
    } else if (!_.isString(_id)) {
        throw new Error('When defined the id must be a string');
    }

    internalInitalSet.call(this, _id, key, value, status, owner);
};

Scope.prototype.get = function get(key) {
    validateKey(key);

    return this.data[key];
};

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

        this.emit('update', { [key]: target });
    }
}

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
