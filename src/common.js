const _ = require('lodash');
const moment = require('moment');
const Console = require('console');

function _flattenWith(data, cb) {
    if (_.isArray(data)) {
        _.forEach(data, (item) => {
            _flattenWith.call(this, item, cb);
        });
    } else {
        this.push(cb(data));
    }
}

module.exports.flattenWith = function flattenWith(data, cb) {
    let _cb = cb;

    if (_.isNil(_cb)) {
        _cb = arg => arg;
    }

    const flattened = [];

    _flattenWith.call(flattened, data, _cb);

    return flattened;
};

module.exports.isDate = function isDate(strValue) {
    const date = moment(strValue, moment.ISO_8601);

    return date !== null && date.isValid();
};

module.exports.checkDisposed = function checkDisposed(target, asWarning) {
    if (this.runStatus === 'disposed' || this.runStatus === 'disposing') {
        const message = 'This object has been disposed or is being disposed.';

        if (asWarning) {
            Console.warn(message);
        } else {
            throw new Error(message);
        }
    }
};
