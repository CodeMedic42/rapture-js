// const EventEmitter = require('eventemitter3');
// const Util = require('util');
// const _ = require('lodash');
// const ShortId = require('shortid');
//
// function SuperEmitter() {
//     if (!(this instanceof SuperEmitter)) {
//         return new SuperEmitter();
//     }
//
//     EventEmitter.call(this);
// }
//
// Util.inherits(SuperEmitter, EventEmitter);
//
// function quickOn(event, callback, context) {
//     EventEmitter.prototype.on.call(this, event, callback, context);
//
//     return () => {
//         EventEmitter.prototype.removeListener.call(this, event, callback, context);
//     };
// }
//
// SuperEmitter.prototype.on = function on(events, callback, context) {
//     if (_.isString(events)) {
//         return quickOn(events, callback, context);
//     } else if (!_.isArray(events)) {
//         throw new Error('Must be a string or an array');
//     }
//
//     const meta = {
//         id: ShortId.generate()
//     };
//     const seen = {};
//
//     _.forEach(events, (event) => {
//         if (seen[event]) {
//             return;
//         }
//
//         seen[event] = true;
//
//         this.applications[event][meta.id] = meta;
//     });
//
//     EventEmitter.prototype.on.call(this, meta.id, callback, context);
//
//     return () => {
//         EventEmitter.prototype.removeListener.call(this, meta.id, callback, context);
//     };
// };
//
// SuperEmitter.prototype.emit = function emit(events, ...args) {
//     const _events = _.isArray(events) ? events : [events];
//
//     const prepareEmmitance = {};
//
//     _.forEach(_events, (event) => {
//         prepareEmmitance[event] = [event];
//
//         _.forOwn(this.applications[event], (meta, id) => {
//             if (prepareEmmitance[id] == null) {
//                 prepareEmmitance[id] = [event];
//             } else {
//                 prepareEmmitance[id].push(event);
//             }
//         });
//
//         _.forOwn(prepareEmmitance, (eventList, id) => {
//             EventEmitter.prototype.emit.call(this, id, eventList, ...args);
//         });
//     });
// };
