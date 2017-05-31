const _ = require('lodash');
const Util = require('util');
const EventEmitter = require('eventemitter3');
const Common = require('./common.js');
const ArtifactContext = require('./artifactContext.js');
const Scope = require('./scope.js');

function SessionContext() {
    if (!(this instanceof SessionContext)) {
        return new SessionContext();
    }

    this.scope = Scope('__session');
    this.contexts = {};
    this.status = 'started';

    EventEmitter.call(this);
}

Util.inherits(SessionContext, EventEmitter);

SessionContext.prototype.createArtifactContext = function createArtifactContext(id, ruleDefinition, artifact) {
    Common.checkDisposed(this);

    if (!_.isNil(this.contexts[id])) {
        throw new Error(`${id} already exists`);
    }

    this.contexts[id] = ArtifactContext(id, ruleDefinition, artifact, this.scope);

    this.contexts[id].on('disposed', () => {
        delete this.contexts[id];
    });

    return this.contexts[id];
};

SessionContext.prototype.getArtifactContext = function getArtifactContext(id) {
    Common.checkDisposed(this);

    return this.contexts[id];
};

SessionContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    return _.reduce(this.contexts, (results, context, contextId) => {
        const _results = results;

        _results[contextId] = context.issues();

        return _results;
    }, {});
};

SessionContext.prototype.dispose = function dispose() {
    Common.checkDisposed(this, true);

    this.runStatus = 'disposing';

    _.forEach(this.contexts, (context) => {
        context.dispose();
    }, []);

    this.contexts = null;

    this.scope.dispose();

    this.status = 'disposed';

    this.emit('disposed');
};

SessionContext.prototype.register = function register(key, value) {
    Common.checkDisposed(this);

    this.scope.set(null, key, value, true, this);
};

module.exports = SessionContext;
