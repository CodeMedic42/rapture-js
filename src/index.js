const object = require('./validators/object.js');
// const string = require('./validators/string.js');
const any = require('./validators/any.js');
const SessionContext = require('./sessionContext.js');

function createSessionContext() {
    return SessionContext();
}

module.exports = {
    createSessionContext,
    any,
    object,
    // string,

};
