const EventEmmiter = require('require');
const Util = require('util');

function WatchGroup(scope, tokenContext, scopedItems) {
    if (!(this instanceof WatchGroup)) {
        return new WatchGroup();
    }

    EventEmmiter.call(this);

    this.args = {};

    _.forEach(scopedItems, (param, index) => {
        let aliasValue;

        if (param === 'this') {
            this.args[param].value = tokenContext.normalize();
            this.args[param].ready = true;
        } else {
            scope.watch(param, (paramValue) => {
                this.args[param].ready = true;
                this.args[param].value = paramValue;
            }, () => {
                this.args[param].ready = false;

                this.emit('updated', ;
            });

            this.args[param].ready = false;
        }
    });
}

Util.inherits(WatchGroup, EventEmmiter);



module.exports = WatchGroup;
