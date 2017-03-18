const _ = require('lodash');
const ArtifactContext = require('./artifactContext.js');
const Scope = require('./scope.js');

function SessionContext() {
    if (!(this instanceof SessionContext)) {
        return new SessionContext();
    }

    this.scope = Scope('__session');
    this.contexts = {};
}

SessionContext.prototype.createArtifactContext = function createArtifactContext(id, ruleDefinition, artifact) {
    if (!_.isNil(this.contexts[id])) {
        throw new Error(`${id} already exists`);
    }

    this.contexts[id] = ArtifactContext(id, ruleDefinition, artifact, this.scope);

    return this.contexts[id];
};

module.exports = SessionContext;
