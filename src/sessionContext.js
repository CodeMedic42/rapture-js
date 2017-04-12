const _ = require('lodash');
const Util = require('util');
const EventEmitter = require('eventemitter3');
const Console = require('console');
const ArtifactContext = require('./artifactContext.js');
const Scope = require('./scope.js');

function checkDisposed(asWarning) {
    if (this.status === 'disposed') {
        const message = 'This object has been disposed.';

        if (asWarning) {
            Console.warn(message);
        } else {
            throw new Error(message);
        }
    }
}

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
    checkDisposed.call(this);

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
    checkDisposed.call(this);

    return this.contexts[id];
};

SessionContext.prototype.issues = function issues() {
    checkDisposed.call(this);

    return _.reduce(this.contexts, (issueList, context) => {
        issueList.push(...context.issues());

        return issueList;
    }, []);
};

SessionContext.prototype.dispose = function dispose() {
    this.runStatus = 'disposing';

    checkDisposed.call(this, true);

    _.forEach(this.contexts, (context) => {
        context.dispose();
    }, []);

    this.contexts = null;

    this.scope.dispose();

    this.status = 'disposed';

    this.emit('disposed');
};


module.exports = SessionContext;
