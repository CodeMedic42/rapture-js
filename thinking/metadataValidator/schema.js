const BuildModelRule = require('./common.js').buildModelRule;

function buildSchema() {
    return rapture.object().keys({
        model: BuildModelRule(),
    }).required('model');
}

module.exports = buildSchema;
