const _ = require('lodash');

// TODO need to handle ref

module.exports = function setup(rapture) {
    let compile = null;

    function buildKeys(properties) {
        const keys = {};

        _.forOwn(properties, (def, name) => {
            keys[name] = compile(def);
        });

        return keys;
    }

    compile = (target) => {
        let rule = null;

        if (target.type === 'object') {
            rule = rapture.object()
            .keys(buildKeys(target.properties));
        } else if (target.type === 'array') {
            rule = rapture.array()
            .items(compile(target.items));
        } else if (target.type === 'string') {
            rule = rapture.string();
        } else if (target.type === 'number') {
            rule = rapture.number();
        } else if (target.type === 'boolean') {
            rule = rapture.boolean();
        } else if (target.type === 'date') {
            rule = rapture.date();
        } else {
            throw new Error('Not Implemented');
        }

        return rule;
    };

    return (value) => {
        let target = value;

        if (_.isString(value)) {
            target = JSON.parse();
        }

        if (!_.isPlainObject(target)) {
            throw new Error('Must be a plain JavaScript object');
        }

        return compile(target);
    };
};
