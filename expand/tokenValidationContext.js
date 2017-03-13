const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const Issue = require('./issue.js');
const Scope = require('./scope.js');

function TokenValidationContext(rule, tokenContext) {
    if (!(this instanceof TokenValidationContext)) {
        return new TokenValidationContext(rule, tokenContext);
    }

    this.

    EventEmitter.call(this);
}

Util.inherits(ArtifactContext, EventEmitter);

module.exports = TokenValidationContext;
