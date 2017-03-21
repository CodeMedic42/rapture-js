const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');

function internalSet(id, value, ready, owner) {
    let target = this.data[id];
    const status = ready ? 'ready' : 'failed';

    if (_.isNil(target)) {
        // We have no value for this in memory at this scope.
        // Just set it no matter what.
        target = this.data[id] = { owner, value, status };
    } else {
        const oldValue = target.value;
        const oldStatus = target.status;

        if (_.isNil(target.owner)) {
            // origial was set by parent, we can override this value no matter what
            target.value = value;
            target.status = status;
        } else if (!_.isNil(owner)) {
            if (owner === target.owner) {
                // The owner is changing this value
                target.value = value;
                target.status = status;
            } else {
                // This value is being updated by someone else and this cannot be allowed.
                throw new Error(`Cannot set duplicate value for ${id}`);
            }
        }

        if ((oldValue === target.value) && (oldStatus === target.status)) {
            // Nothing changes
            return null;
        }
    }

    // we changed something
    _.forEach(this.watches[id], (watch) => {
        watch(target.status, target.value);
    });

    return target;
}

function internalRemove(id, owner) {
    let target = this.data[id];

    if (_.isNil(target)) {
        return null;
    }

    if (_.isNil(target.owner)) {
        // This was set by our parent, we cannot remove it.
        throw new Error('Attempting to remove a value from the wrong scope.');
    } else if (target.owner !== owner) {
        throw new Error(`Only owner can remove ${id}`);
    }

    const oldValue = target.value;
    const oldStatus = target.status;

    delete this.data[id];

    target.status = 'undefined';

    // We need to check to see if a value by the same id exists in the partent.
    // If so we need to use that.
    const parentData = this.parentScope.data[id];

    if (!_.isNil(parentData)) {
        target = this.data[id] = parentData;
    }

    if ((oldValue === target.value) && (oldStatus === target.status)) {
        // Nothing actualy changed about the data.
        return null;
    }

    _.forEach(this.watches[id], (watch) => {
        watch(target.status, target.value);
    });

    return target;
}

function updateFromParent(parentData) {
    const updatedData = {};
    let updateAvaliable = false;

    _.forOwn(parentData, (data, dataId) => {
        let target;

        if (data.status === 'undefined') {
            target = internalRemove.call(this, dataId, null);
        } else {
            target = internalSet.call(this, dataId, data.value, data.status, null);
        }

        if (!_.isNil(target)) {
            updatedData[dataId] = target;
            updateAvaliable = true;
        }
    });

    if (updateAvaliable) {
        this.emit('update', updatedData);
    }
}

function Scope(id, parentScope) {
    if (!(this instanceof Scope)) {
        return new Scope(id, parentScope);
    }

    this.data = {};
    this.id = id;
    this.parentScope = parentScope;
    this.watches = {};

    EventEmitter.call(this);

    if (!_.isNil(this.parentScope)) {
        this.parentScope.on('update', (updatedData) => {
            updateFromParent.call(this, updatedData);
        });

        updateFromParent.call(this, this.parentScope.data);
    }
}

Util.inherits(Scope, EventEmitter);

Scope.prototype.createChildScope = function createChildScope(id) {
    return Scope(id, this);
};

function internalInitalSet(scopeID, id, value, ready, owner) {
    if (scopeID !== this.id) {
        if (_.isNil(this.parentScope)) {
            throw new Error(`Scope "${scopeID}" does not exist.`);
        }

        internalInitalSet.call(this.parentScope, scopeID, id, value, ready, owner);

        return;
    }

    const newValue = internalSet.call(this, id, value, ready, owner);

    if (!_.isNil(newValue)) {
        this.emit('update', { [id]: newValue });
    }
}

Scope.prototype.set = function set(scopeID, id, value, ready, owner) {
    if (_.isNil(owner)) {
        throw new Error('Must supply an owner');
    }

    if (_.isNil(scopeID)) {
        scopeID = this.id; // eslint-disable-line no-param-reassign
    } else if (!_.isString(scopeID)) {
        throw new Error('scopeID must be a string when used');
    }

    internalInitalSet.call(this, scopeID, id, value, ready, owner);
};

Scope.prototype.get = function get(id) {
    return this.data[id];
};

function internalInitalRemove(scopeID, id, owner) {
    if (scopeID !== this.id) {
        if (_.isNil(this.parentScope)) {
            throw new Error(`Scope "${scopeID}" does not exist.`);
        }

        internalRemove.call(this.parentScope, scopeID, id, owner);

        return;
    }

    const removedValue = internalRemove.call(this, id, owner);

    if (!_.isNil(removedValue)) {
        this.emit('update', { [id]: removedValue });
    }
}

Scope.prototype.remove = function remove(scopeID, id, owner) {
    if (_.isNil(owner)) {
        throw new Error('Must supply an owner');
    }

    if (!_.isNil(scopeID)) {
        if (!_.isString(scopeID)) {
            throw new Error('scopeID must be a string when used');
        }
    } else {
        scopeID = this.id; // eslint-disable-line no-param-reassign
    }

    internalInitalRemove.call(this, scopeID, id, owner);
};

Scope.prototype.watch = function watch(id, onUpdate) {
    const watches = this.watches[id] = this.watches[id] || [];

    const watchCallback = onUpdate;

    watches.push(watchCallback);

    const target = this.data[id];

    if (_.isNil(target)) {
        onUpdate('undefined');
    } else {
        onUpdate(target.status, target.value);
    }

    return () => {
        _.pull(watches, watchCallback);
    };
};

module.exports = Scope;
