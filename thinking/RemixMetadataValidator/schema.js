const BuildModelRule = require('./common.js').buildModelRule;

function buildSchema() {
    return jRule.object().keys({
        model: BuildModelRule(),
    }).required('model');
}

module.exports = buildSchema;
