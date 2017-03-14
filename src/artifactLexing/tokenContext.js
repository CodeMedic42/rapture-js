const _ = require('lodash');
const _StringToPath = require('lodash/_stringToPath');

function TokenContext(contents, location, from) {
    if (!(this instanceof TokenContext)) {
        return new TokenContext(contents, location, from);
    }

    this.contents = contents;
    this.location = location;
    this.from = from;
}

TokenContext.prototype.get = function get(path) {
    if (!_.isString(path)) {
        throw new Error('Path must be a string');
    }

    const nodes = _StringToPath(path);

    return _.reduce(nodes, (current, node) => {
        let target = current.contents[node];

        if (_.isNil(target)) {
            const from = current.from.length <= 0 ? node : `${current.from}.${node}`;
            target = TokenContext(undefined, current.location, from);

            target.on('update', this.emit('update'));
        }

        return target;
    }, this);
};

TokenContext.prototype.normalize = function normalize() {
    if (!_.isNil(this.normalized)) {
        return this.normalized;
    }

    if (!_.isObject(this.contents)) {
        this.normalized = this.contents;

        return this.normalized;
    }

    let type = {};

    if (_.isArray(this.contents)) {
        type = [];
    }

    this.normalized = _.reduce(this.contents, (current, item, name) => {
        current[name] = item.normalize(); // eslint-disable-line no-param-reassign

        return current;
    }, type);

    return this.normalized;
};

module.exports = TokenContext;
