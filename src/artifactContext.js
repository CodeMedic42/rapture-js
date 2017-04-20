const EventEmitter = require('eventemitter3');
const Util = require('util');
const _ = require('lodash');
const ArtifactLexor = require('./artifactLexing/artifactLexer.js');
const Scope = require('./scope.js');
const RunContext = require('./runContext.js');
const Issue = require('./issue.js');
const Common = require('./common.js');

function emitRaise(force) {
    if (this.runStatus === 'started' || force) {
        this.emit('raise');

        return;
    }

    this.runStatus = 'emitNeeded';
}

function buildToken(artifact) {
    let _artifact = artifact;

    if (_.isNil(_artifact)) {
        _artifact = '';
    } else if (!_.isString(_artifact)) {
        throw new Error('Artifact must be a string');
    }

    try {
        const token = ArtifactLexor(_artifact);

        return token;
    } catch (error) {
        if (error instanceof Issue) {
            this.compacted = [error];

            emitRaise.call(this);
        } else {
            throw error;
        }
    }

    return null;
}

function setToken(artifact) {
    this.tokenContext = buildToken.call(this, artifact);

    if (_.isNil(this.tokenContext)) {
        return;
    }

    this.tokenContext.on('raise', emitRaise, this);

    this.initalRuleScope = Scope(null, this.scope);

    const runContext = RunContext(this.initalRuleScope);

    this.tokenContext.addRunContext(runContext);

    this.ruleContext = runContext.createRuleContext(this.rule);

    this.ruleContext.start();
}

function disposeToken() {
    // if (!_.isNil(this.ruleContext)) {
    //     this.ruleContext.dispose();
    //     this.ruleContext = null;
    // }

    if (!_.isNil(this.tokenContext)) {
        this.tokenContext.dispose().commit();
    }

    if (!_.isNil(this.initalRuleScope)) {
        this.initalRuleScope.dispose();
    }

    this.initalRuleScope = null;
    this.tokenContext = null;
}

function updateToken(artifact) {
    const newToken = buildToken.call(this, artifact);

    if (_.isNil(newToken)) {
        disposeToken.call(this);
    } else {
        this.tokenContext.update(newToken);
    }
}

function ArtifactContext(id, rule, artifact, sessionScope) {
    if (!(this instanceof ArtifactContext)) {
        return new ArtifactContext(id, rule, artifact, sessionScope);
    }

    this.id = id;
    this.scope = Scope('__artifact', sessionScope);
    this.scope.set(this.scope.id, id, true, true, this);
    this.rule = rule;
    this.runStatus = 'starting';
    this.compacted = null;

    EventEmitter.call(this);

    setToken.call(this, artifact);

    this.runStatus = 'started';
}

Util.inherits(ArtifactContext, EventEmitter);

ArtifactContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    if (_.isNil(this.compacted)) {
        this.compacted = this.tokenContext.issues();
    }

    return this.compacted;
};

ArtifactContext.prototype.update = function update(artifact) {
    Common.checkDisposed(this);

    this.runStatus = 'updating';

    this.compacted = null;

    if (_.isNil(this.tokenContext)) {
        setToken.call(this, artifact);
    } else {
        updateToken.call(this, artifact);
    }

    if (this.runStatus === 'emitNeeded') {
        emitRaise.call(this, true);
    }

    this.runStatus = 'started';
};

ArtifactContext.prototype.dispose = function dispose() {
    this.runStatus = 'disposing';

    Common.checkDisposed(this, true);

    disposeToken.call(this);

    if (!_.isNil(this.scope)) {
        this.scope.dispose();
        this.scope = null;
    }

    this.compacted = null;

    this.runStatus = 'disposed';

    this.emit('disposed');
};

module.exports = ArtifactContext;
