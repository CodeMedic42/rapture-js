const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const Symbol = require('es6-symbol');
const ControlLoader = require('./control.js');

let __Observable;
let __unlinkControl;
let __linkControl;
let __Control;

const privateSymbol = Symbol('private');

function _emitChange() {
    if (this[privateSymbol].status !== 'running') {
        return;
    }

    this.emit('change');
}

function _emitUpdate() {
    if (this[privateSymbol].status !== 'running') {
        return;
    }

    this.emit('update');
}

function _emitReplace(replacement) {
    __unlinkControl.call(this);

    __linkControl.call(this, replacement);
}

__linkControl = function _linkControl(control) {
    this[privateSymbol].control = control;

    control.on('change', _emitChange, this);
    control.on('replace', _emitReplace, this);
    control.on('update', _emitUpdate, this);

    this[privateSymbol].disconnectListener = () => {
        control.removeListener('change', _emitChange, this);
        control.removeListener('replace', _emitReplace, this);
        control.removeListener('update', _emitUpdate, this);

        this[privateSymbol].control = null;
        this[privateSymbol].disconnectListener = null;

        return control;
    };
};

__unlinkControl = function _unlinkControl() {
    if (!_.isNil(this[privateSymbol].disconnectListener)) {
        return this[privateSymbol].disconnectListener();
    }

    return null;
};

function _buildControl(item) {
    let control;

    if (item instanceof __Observable) {
        if (item.isDisposed()) {
            throw new Error('This observable has already been disposed.');
        }

        control = item[privateSymbol].control;
    } else if (item instanceof __Control) {
        control = item;
    } else {
        control = __Control(item);
    }

    __linkControl.call(this, control);
}

__Observable = function Observable(...args) {
    if (!(this instanceof __Observable)) {
        return new __Observable(...args);
    }

    EventEmitter.call(this);

    this[privateSymbol] = {
        status: 'running'
    };

    _buildControl.call(this, args[0]);
};

__Control = ControlLoader(__Observable, privateSymbol);

Util.inherits(__Observable, EventEmitter);

__Observable.prototype.value = function value() {
    return this[privateSymbol].control._value;
};

__Observable.prototype.get = function get(id) {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    if (_.isNil(id) || id === '') {
        return this;
    } else if (_.isString(id)) {
        const target = this[privateSymbol].control.get(id);

        if (_.isNil(target)) {
            return target;
        }

        return __Observable(target);
    }

    throw new Error('Invalid Id');
};

__Observable.prototype.set = function set(...args) {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    let id;
    let value;

    if (args.length <= 0) {
        return;
    } else if (args.length === 1) {
        value = args[0];
    } else {
        id = args[0];
        value = args[1];
    }

    if (value instanceof __Observable) {
        value = value[privateSymbol].control;
    }

    this[privateSymbol].control.set(id, value);
};

__Observable.prototype.delete = function delete_(id) {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    this[privateSymbol].control.delete(id);
};

__Observable.prototype.remove = function remove(cb) {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    this[privateSymbol].control.remove(cb);
};

__Observable.prototype.dispose = function dispose() {
    if (this.isDisposed()) {
        return;
    }

    __unlinkControl.call(this);

    this[privateSymbol].status = 'disposed';
};

__Observable.prototype.isDisposed = function isDisposed() {
    return this[privateSymbol].status === 'disposed';
};

__Observable.prototype.pause = function pause() {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    this[privateSymbol].status = 'paused';
};

__Observable.prototype.run = function run() {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    this[privateSymbol].status = 'running';
};

__Observable.prototype.push = function push(value) {
    if (this.isDisposed()) {
        throw new Error('This object has been disposed');
    }

    this[privateSymbol].control.push(value);
};

module.exports = __Observable;
