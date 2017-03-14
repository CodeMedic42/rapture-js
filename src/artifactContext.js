const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const ArtifactLexor = require('./artifactLexing/artifactLexer.js');
const Scope = require('./scope.js');

function setArtifact(artifact) {
    this.runStatus = 'stopped';

    if (_.isNil(artifact)) {
        artifact = ''; // eslint-disable-line no-param-reassign
    } else if (!_.isString(artifact)) {
        throw new Error('Artifact must be a string');
    }

    if (!_.isNil(this.ruleContext)) {
        this.ruleContext.destroy();
    }

    const initalRuleScope = Scope(null, this.scope);

    this.ruleContext = this.rule.buildContext(initalRuleScope, ArtifactLexor(artifact));

    this.ruleContext.on('update', (issues) => {
        if (this.runStatus === 'started') {
            this.emit('update', issues);
        }
    });

    this.runStatus = 'starting';

    this.ruleContext.start();

    this.runStatus = 'started';
}

function ArtifactContext(id, rule, artifact, sessionScope) {
    if (!(this instanceof ArtifactContext)) {
        return new ArtifactContext(id, rule, artifact, sessionScope);
    }

    this.id = id;
    this.scope = Scope('artifact', sessionScope);
    this.rule = rule;
    setArtifact.call(this, artifact);

    EventEmitter.call(this);
}

Util.inherits(ArtifactContext, EventEmitter);

ArtifactContext.prototype.issues = function issues() {
    return this.ruleContext.issues();
};

ArtifactContext.prototype.update = function update(artifact) {
    setArtifact.call(this, artifact);

    this.emit('update', this.issues());
};

module.exports = ArtifactContext;
