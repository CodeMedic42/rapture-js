const _ = require('lodash');
const Util = require('util');
const EventEmitter = require('eventemitter3');
const _StringToPath = require('lodash/_stringToPath');
const Common = require('../common.js');

function emitIssues(force) {
    if (this.runStatus === 'started' || force) {
        this.emit('raise');

        return;
    }

    this.runStatus = 'emitPending';
}

function emitPersonalIssues(force) {
    this.compactedIssues = null;

    emitIssues.call(this, force);
}

function linkContent(content) {
    content.on('raise', emitIssues, this);
}

function linkContents() {
    if (_.isPlainObject(this.contents) || _.isArray(this.contents)) {
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

function TokenContext(contents, location, from) {
    if (!(this instanceof TokenContext)) {
        return new TokenContext(contents, location, from);
    }

    this.contents = contents;
    this.location = location;
    this.from = from;
    this.runContexts = [];
    this.compactedIssues = null;
    this.runStatus = 'started';

    EventEmitter.call(this);

    linkContents.call(this);
}

Util.inherits(TokenContext, EventEmitter);

TokenContext.prototype.issues = function issues() {
    Common.checkDisposed(this);

    const finalIssues = [];

    if (_.isArray(this.contents) || _.isPlainObject(this.contents)) {
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
    //
    // runContext.on('destroy', () => {
    //     _.pull(this.runContexts, runContext);
    // });

    runContext.runWith(this.contents);

    this.runContexts.push(runContext);

    // TODO: Is this going to cause noise?
    emitPersonalIssues();
};

function updateContexts() {
    _.forEach(this.runContexts, (runContext) => {
        runContext.runWith(this.contents);
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

    if (_.isNil(newContents) && _.isNil(oldContents)) {
        // Nothing needs updated;
        return;
    } else if (_.isPlainObject(newContents) && _.isPlainObject(oldContents)) {
        if (!checkContents.call(this, newContents, oldContents)) {
            // If it passed then nothing to update.
            return;
        }
    } else if (_.isArray(newContents) && _.isArray(oldContents)) {
        if (!checkContents.call(this, newContents, oldContents)) {
            // If it passed then nothing to update.
            return;
        }
    } else if (newContents === oldContents) {
        // Nothing needs updated;
        return;
    }

    if (_.isPlainObject(oldContents) || _.isArray(oldContents)) {
        const commits = [];

        _.forEach(this.contents, (content) => {
            commits.push(content.dispose().commit);
        });

        _.forEach(commits, (commit) => {
            commit();
        });
    }

    this.contents = newContents;

    linkContents.call(this);

    updateContexts.call(this);
}

TokenContext.prototype.update = function update(newTokenContext) {
    Common.checkDisposed(this);

    this.runStatus = 'updating';

    updateContents.call(this, newTokenContext);
    const locationUpdated = this.location.update(newTokenContext.location);

    if (this.runStatus === 'emitPending' || locationUpdated) {
        emitPersonalIssues.call(this, true);
    }

    this.runStatus = 'started';
};

TokenContext.prototype.get = function get(path) {
    Common.checkDisposed(this);

    if (!_.isString(path)) {
        throw new Error('Path must be a string');
    }

    const nodes = _StringToPath(path);

    return _.reduce(nodes, (current, node) => {
        const target = current.contents[node];

        // TODO: determine if this code is needed.
        // if (_.isNil(target)) {
        //     const from = current.from.length <= 0 ? node : `${current.from}.${node}`;
        //     target = TokenContext(undefined, current.location, from);
        // }

        return target;
    }, this);
};

TokenContext.prototype.getRaw = function getRaw() {
    Common.checkDisposed(this);

    if (!_.isNil(this.raw)) {
        return this.raw;
    }

    if (!_.isObject(this.contents)) {
        this.raw = this.contents;

        return this.raw;
    }

    let type = {};

    if (_.isArray(this.contents)) {
        type = [];
    }

    this.raw = _.reduce(this.contents, (current, item, name) => {
        current[name] = item.getRaw(); // eslint-disable-line no-param-reassign

        return current;
    }, type);

    return this.raw;
};

TokenContext.prototype.dispose = function dispose() {
    Common.checkDisposed(this, true);

    if (this.runStatus === 'disposed' || this.runStatus === 'disposing') {
        return { commit: () => {} };
    }

    this.runStatus = 'disposing';

    const commits = [];

    if (_.isPlainObject(this.contents) || _.isArray(this.contents)) {
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

            this.runStatus = 'disposed';

            this.emit('disposed');
        }
    };
};

module.exports = TokenContext;
