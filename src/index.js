const object = require('./validators/object.js');
const string = require('./validators/string.js');
const SessionContext = require('./sessionContext.js');

function createSessionContext(ruleDefinition) {
    return SessionContext(ruleDefinition);
}

module.exports = {
    object,
    string,
    createSessionContext
};
