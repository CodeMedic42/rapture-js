const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const ArtifactLexor = require('./artifactLexing/artifactLexer.js');
const RuleContext = require('./ruleContext.js');
const Scope = require('./scope.js');

function ArtifactContext(sessionScope, ruleDefinition, artifact) {
    if (!(this instanceof ArtifactContext)) {
        return new ArtifactContext(sessionScope, ruleDefinition, artifact);
    }

    this.scope = Scope('artifact', sessionScope);
    this.ruleDefinition = ruleDefinition;
    this.update(artifact);

    EventEmitter.call(this);
}

Util.inherits(ArtifactContext, EventEmitter);

RuleContext.prototype.issues = function issues() {
    return this.ruleContext.issues();
};

ArtifactContext.prototype.update = function update(artifact) {
    if (_.isNil(artifact)) {
        artifact == '';
    } else if (!_.isString(artifact)) {
        throw new Error('Artifact must be a string');
    }

    this.ruleContext = RuleContext(this.scope, this.ruleDefinition, ArtifactLexor(artifact));

    this.ruleContext.on('update', (issues) => {
        this.emit('update', issues);
    });
};

module.exports = ArtifactContext;
