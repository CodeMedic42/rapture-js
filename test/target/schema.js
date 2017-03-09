const Rapture = require('rapture');
const Common = require('./common.js');

function buildSchema() {
    return Rapture.object().keys({
        model: Common.buildModelRule(),
    }).required('model');
}

module.exports = buildSchema;
