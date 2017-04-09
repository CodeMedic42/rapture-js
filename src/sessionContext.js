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

SessionContext.prototype.getArtifactContext = function getArtifactContext(id) {
    return this.contexts[id];
};

SessionContext.prototype.issues = function issues() {
    return _.reduce(this.contexts, (issueList, context) => {
        issueList.push(...context.issues());

        return issueList;
    }, []);
};

SessionContext.prototype.destroy = function destroy() {
    _.forEach(this.contexts, (context, index) => {
        context.destroy();

        this.contexts[index] = null;
    }, []);

    this.contexts = null;

    this.scope.destroy();
};


module.exports = SessionContext;
