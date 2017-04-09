const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const ArtifactLexor = require('./artifactLexing/artifactLexer.js');
const Scope = require('./scope.js');
const RunContext = require('./runContext.js');

function emitRaise(force) {
    if (this.runStatus === 'started' || force) {
        this.emit('raise');

        return;
    }

    this.runStatus = 'emitNeeded';
}

function setArtifact(artifact) {
    let _artifact = artifact;

    if (_.isNil(_artifact)) {
        _artifact = '';
    } else if (!_.isString(_artifact)) {
        throw new Error('Artifact must be a string');
    }

    if (!_.isNil(this.ruleContext)) {
        this.ruleContext.destroy();
    }

    const initalRuleScope = Scope(null, this.scope);

    this.runStatus = 'starting';

    this.tokenContext = ArtifactLexor(_artifact);

    this.tokenContext.on('raise', emitRaise, this);

    const runContext = RunContext(initalRuleScope);

    this.tokenContext.addRunContext(runContext);

    this.ruleContext = runContext.createRuleContext(this.rule);

    this.ruleContext.start();

    this.runStatus = 'started';
}

function ArtifactContext(id, rule, artifact, sessionScope) {
    if (!(this instanceof ArtifactContext)) {
        return new ArtifactContext(id, rule, artifact, sessionScope);
    }

    this.id = id;
    this.scope = Scope('__artifact', sessionScope);
    this.rule = rule;
    this.runStatus = 'stopped';

    EventEmitter.call(this);

    setArtifact.call(this, artifact);
}

Util.inherits(ArtifactContext, EventEmitter);

ArtifactContext.prototype.issues = function issues() {
    return this.tokenContext.issues();
};

ArtifactContext.prototype.update = function update(artifact) {
    this.runStatus = 'updating';

    let _artifact = artifact;

    if (_.isNil(_artifact)) {
        _artifact = '';
    } else if (!_.isString(_artifact)) {
        throw new Error('Artifact must be a string');
    }

    this.tokenContext.update(ArtifactLexor(artifact));

    if (this.runStatus === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.runStatus = 'started';
};

ArtifactContext.prototype.destroy = function destroy() {
    this.scope.destroy();

    this.emit('destroy');
};

module.exports = ArtifactContext;
