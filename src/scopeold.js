const EventEmmiter = require('event');
const Util = require('util');

function Scope(id, parentScope) {
    if (!(this instanceof Scope)) {
        return new Scope(id, parentScope);
    }

    this.data = {};
    this.id = id;
    this.parentScope = parentScope;

    if (_.isNil(parentScope)) {
        pending = [];
    } else {
        this.pending = pending;
    }

    EventEmmiter.call(this);
}

Util.inherits(Scope, EventEmitter);

Scope.prototype.createChildScope = function createChildScope(id) {
    return Scope(id, this);
}

// function thing(id) {
//     if (_.startsWith(id, '@')) {
//
//     } else {
//
//     }
// }

Scope.prototype.set = function set(scopeID, id, value, ready, owner) {
    if (!_.isNil(scopeID) {
        if (!_.isString(scopeID)) {
            throw new Error('scopeID must be a string when used');
        }

        if (scopeID !== this.id) {
            if (_.isNil(this.parentScope)) {
                throw new Error(`Scope "${scopeID}" does not exist.`);
            }

            return this.parentScope.set(scopeID, id, value, ready, owner);
        }
    }

    const target = this.data[id] = this.data[id] || {
        owner
    };

    if (target.owner !== owner) {
        throw new Error(`Cannot set duplicate value for ${id}`);
    }

    target.value = value;
    target.status = ready ? 'ready' : 'failed';
    const callbacks = target.callbacks = target.callbacks || [];

    this.pending[id]
};

Scope.prototype.remove = function remove(scopeID, id, owner) {
    if (!_.isNil(scopeID) {
        if (!_.isString(scopeID)) {
            throw new Error('scopeID must be a string when used');
        }

        if (scopeID !== this.id) {
            if (_.isNil(this.parentScope)) {
                throw new Error(`Scope "${scopeID}" does not exist.`);
            }

            return this.parentScope.remove(scopeID, id, value, owner);
        }
    }

    const target = this.data[id];

    if (_.isNil(target)) {
        return;
    }

    if (target.owner !== owner) {
        throw new Error(`Only owner can remove ${id}`);
    }

    _.forEach(target.callbacks, (callback) => {
        callback('undefined');
    });

    delete this.data[id];
};

function addPending() {

}

function internalWatch(id, onUpdate, original) {
    const target = this.data[id];

    if (_.isNil(target)) {
        if (_.isNil(this.parentScope)) {
            // Nothing has been defined yet for this id.
            // We will let the original call to handle the issue.
            return null;
        }

        const ender = internalWatch.call(this.parentScope, id, onUpdate, false);

        // If we are not in the original callstack item then we do not care if it was handled or not.
        if (!original) {
            // Just return the result
            return ender;
        } else if (!_.isNil(ender)) {
            // Cool we have a watch going.
            // Return it to the main method.
            return ender;
        }

        // OK. We are in the original call and nothing was returned.
        // The id must not exist yet.
        // Lets add it to the pending system to be handled later.

        const pendTarget = this.pending[id] = this.pending[id] || {
            from: {}
        };

        const callbackArray = pendTarget.from[this] = pendTarget.from[this] || [];

        callbackArray.push(onUpdate);

        // Do the first callback. Since it was never handled we send undefined.
        onUpdate('undefined');
    } else {
        // Add the callback to the existing target.
        target.target.callbacks.push(onUpdate);

        // Do the first callback
        onUpdate(target.status, target.value);

        // Need to return the callback ender here
    }
}

Scope.prototype.watch = function watch(id, onUpdate) {
    // Call the internal method so that we can add some additional values
    return internalWatch.call(this, id, onUpdate, true);
};

Scope.prototype.watchGroup = function watchGroup(items, onReady, onUnReady) {
    args = [];

    const evaluate = _.debounce(() => {
        const result = [];
        const ready = true;

        _.forEach(args, (arg) => {
            result.push(arg.value);

            ready = ready && arg.ready;

            return ready;
        });

        ready ? onReady(result) : onUnReady();
    });

    _.forEach(items, (item, index) => {
        args[index] = {
            ready: false,
            listener: this.watch(item, (paramValue) => {
                args[index].ready = true;
                args[index].value = paramValue;

                evaluate();
            }, () => {
                .args[item].ready = false;
                delete args[index].value;

                evaluate();
            });
        };
    });

    return () => {
        _.forEach(args, (arg) => {
            arg();
        });
    };
}




module.exports = Scope;
