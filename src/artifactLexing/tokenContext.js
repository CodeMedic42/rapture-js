const _ = require('lodash');
const Util = require('util');
const EventEmitter = require('eventemitter3');
const _StringToPath = require('lodash/_stringToPath');
const Common = require('../common.js');

function determineType(content) {
    if (_.isArray(content)) {
        return 'array';
    } else if (_.isPlainObject(content)) {
        return 'object';
    } else if (_.isString(content)) {
        return 'string';
    } else if (_.isFinite(content)) {
        return 'number';
    } else if (_.isBoolean(content)) {
        return 'boolean';
    } else if (_.isBoolean(content)) {
        return 'boolean';
    } else if (content === null) {
        return 'unknown';
    }

    throw new Error('Unknown type');
}

function emit(force) {
    if (this._status.runStatus !== 'started' && !force) {
        return;
    }

    if (this._status.raisePending || this._status.updatedPending) {
        const emitData = {
            raise: this._status.raisePending,
            update: this._status.updatedPending
        };

        this._status.raisePending = false;
        this._status.updatedPending = false;

        this.emit('update', emitData);

        emit.call(this, force);
    }
}

function emitPersonalIssues() {
    this.compactedIssues = null;

    this._status.raisePending = true;

    emit.call(this);
}

function linkContent(content) {
    content.on('update', (emitData) => {
        this._status.raisePending = this._status.raisePending || emitData.raise;
        this._status.updatedPending = this._status.updatedPending || emitData.update;

        emit.call(this);
    }, this);
}

function linkContents() {
    if (this.type === 'object' || this.type === 'array') {
        _.forEach(this.contents, (content) => {
            linkContent.call(this, content);
        });
    }
}

function setupOnDispose(tokenContext, runContext) {
    const cb = () => {
        _.pull(tokenContext.runContexts, runContext);

        runContext.removeListener('disposed', cb);
    };

    runContext.on('disposed', cb);
}

function updateContexts() {
    _.forEach(this.runContexts, (runContext) => {
        runContext.runWith(this);
    });
}

function checkContents(newContents, oldContents) {
    let requiresContentUpdate = false;
    const pendingUpdates = [];

    _.forEach(oldContents, (value, name) => {
        // Check to make sure there are no missing elements
        if (_.isUndefined(newContents[name])) {
            requiresContentUpdate = true;
        } else {
            pendingUpdates.push(() => {
                value.update(newContents[name]);
            });
        }

        return !requiresContentUpdate;
    });

    if (!requiresContentUpdate) {
        // If we passed above then we need to check the reverse
        _.forEach(newContents, (value, name) => {
            if (_.isUndefined(oldContents[name])) {
                requiresContentUpdate = true;
            }

            // If the two items are equal in property names then we should have all the updater functions in pendingUpdates.

            return !requiresContentUpdate;
        });
    }

    if (requiresContentUpdate) {
        return true;
    }

    // If no updates are needed for this object then run the internal pending updates.
    // We only want to run them if we are not going to rerun for this object.

    _.forEach(pendingUpdates, (updater) => {
        updater();
    });

    return false;
}

function updateContents(newTokenContext) {
    const newContents = newTokenContext.contents;
    const oldContents = this.contents;

    const newContentsType = determineType(newContents);

    if (_.isNil(newContents) && _.isNil(oldContents)) {
        // Nothing needs updated;
        return;
    } else if (newContentsType === 'object' && this.type === 'object') {
        if (!checkContents.call(this, newContents, oldContents)) {
            // If it passed then nothing to update.
            return;
        }
    } else if (newContentsType === 'array' && this.type === 'array') {
        if (!checkContents.call(this, newContents, oldContents)) {
            // If it passed then nothing to update.
            return;
        }
    } else if (newContents === oldContents) {
        // Nothing needs updated;
        return;
    }

    if (this.type === 'object' || this.type === 'array') {
        const commits = [];

        _.forEach(this.contents, (content) => {
            commits.push(content.dispose().commit);
        });

        _.forEach(commits, (commit) => {
            commit();
        });
    }

    this.contents = newContents;

    this.type = newContentsType;

    linkContents.call(this);

    updateContexts.call(this);

    this._status.updatedPending = true;
}

function TokenContext(contents, location, from) {
    if (!(this instanceof TokenContext)) {
        return new TokenContext(contents, location, from);
    }

    this._status = {
        updatedPending: false,
        runStatus: 'started'
    };

    this.type = determineType(contents);

    this.contents = contents;
    this.location = location;
    this.from = from;
    this.runContexts = [];
    this.compactedIssues = null;

    EventEmitter.call(this);

    linkContents.call(this);
}

Util.inherits(TokenContext, EventEmitter);

TokenContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    const finalIssues = [];

    if (this.type === 'array' || this.type === 'object') {
        _.forEach(this.contents, (child) => {
            finalIssues.push(...child.issues());
        });
    }

    if (_.isNil(this.compactedIssues)) {
        this.compactedIssues = _.reduce(this.runContexts, (compactedIssues, runContext) => {
            _.forEach(runContext.issues(), (issue) => {
                const _issue = issue;

                if (_.isNil(_issue.location)) {
                    _issue.location = this.location;
                }

                if (_.isNil(_issue.cause)) {
                    _issue.cause = this.from;
                }

                compactedIssues.push(_issue);
                finalIssues.push(_issue);
            });

            return compactedIssues;
        }, []);
    } else {
        finalIssues.unshift(...this.compactedIssues);
    }

    return finalIssues;
};

TokenContext.prototype.addRunContext = function addRunContext(runContext) {
    Common.checkDisposed(this);

    runContext.on('raise', emitPersonalIssues, this);

    setupOnDispose(this, runContext);

    runContext.runWith(this);

    this.runContexts.push(runContext);
};

TokenContext.prototype.update = function update(newTokenContext) {
    Common.checkDisposed(this);

    this._status.runStatus = 'updating';

    this.raw = undefined;

    updateContents.call(this, newTokenContext);
    const locationUpdated = this.location.update(newTokenContext.location);

    if (locationUpdated) {
        this._status.raisePending = true;
    }

    emit.call(this, true);

    this._status.runStatus = 'started';
};

TokenContext.prototype.get = function get(path) {
    Common.checkDisposed(this);

    if (!_.isString(path)) {
        throw new Error('Path must be a string');
    }

    const nodes = _StringToPath(path);

    return _.reduce(nodes, (current, node) => {
        return current.contents[node];
    }, this);
};

TokenContext.prototype.getRaw = function getRaw() {
    Common.checkDisposed(this);

    if (!_.isUndefined(this.raw)) {
        return this.raw;
    }

    let type = null;

    if (this.type === 'array') {
        type = [];
    } else if (this.type === 'object') {
        type = {};
    } else {
        this.raw = this.contents;

        return this.contents;
    }

    this.raw = _.reduce(this.contents, (current, item, name) => {
        current[name] = item.getRaw(); // eslint-disable-line no-param-reassign

        return current;
    }, type);

    return this.raw;
};

TokenContext.prototype.dispose = function dispose() {
    Common.checkDisposed(this, true);

    if (this._status.runStatus === 'disposed' || this._status.runStatus === 'disposing') {
        return { commit: () => {} };
    }

    this._status.runStatus = 'disposing';

    const commits = [];

    if (this.type === 'array' || this.type === 'object') {
        _.forEach(this.contents, (content) => {
            commits.push(content.dispose().commit);
        });
    }

    _.forEach(this.runContexts, (runContext) => {
        commits.push(runContext.dispose().commit);
    });

    return {
        commit: () => {
            _.forEach(commits, (commit) => {
                commit();
            });

            this.contents = null;
            this.location = null;
            this.from = null;
            this.compactedIssues = null;

            this._status.runStatus = 'disposed';

            this.emit('disposed');
        }
    };
};

module.exports = TokenContext;
