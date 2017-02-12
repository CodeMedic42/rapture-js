const EventEmitter = require('events');
const Util = require('util');
const _ = require('lodash');
const ArtifactLexor = require('./artifactLexing/artifactLexer.js');
const RuleContext = require('./ruleContext.js');
const Scope = require('./scope.js');

function ArtifactContext(id, rule, artifact, sessionScope) {
    if (!(this instanceof ArtifactContext)) {
        return new ArtifactContext(id, rule, artifact, sessionScope);
    }

    this.id = id;
    this.scope = Scope('artifact', sessionScope);
    this.rule = rule;
    this.update(artifact);

    EventEmitter.call(this);
}

Util.inherits(ArtifactContext, EventEmitter);

ArtifactContext.prototype.issues = function issues() {
    return this.ruleContext.issues();
};

ArtifactContext.prototype.update = function update(artifact) {
    if (_.isNil(artifact)) {
        artifact == '';
    } else if (!_.isString(artifact)) {
        throw new Error('Artifact must be a string');
    }

    if (!_.isNil(this.ruleContext)) {
        this.ruleContext.destroy();
    }

    const initalRuleScope = Scope(null, this.scope);

    this.ruleContext = RuleContext(this.rule, initalRuleScope, ArtifactLexor(artifact));
    //this.ruleContext = this.rule.createContext(initalRuleScope, ArtifactLexor(artifact));

    this.ruleContext.on('update', (issues) => {
        this.emit('update', issues);
    });
};

module.exports = ArtifactContext;
