const ArtifactContext = require('./artifactContext.js');
const Scope = require('./scope.js');

function SessionContext(ruleDefinition) {
    if (!(this instanceof SessionContext)) {
        return new SessionContext(ruleDefinition);
    }

    this.ruleDefinition = ruleDefinition;
    this.scope = Scope('session');
}

SessionContext.prototype.createArtifactContext = function createArtifactContext(artifact) {
    return ArtifactContext(this.scope, this.ruleDefinition, artifact);
};

module.exports = SessionContext;
