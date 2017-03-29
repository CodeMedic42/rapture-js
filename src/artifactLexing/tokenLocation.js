function TokenLocation(rowStart, rowEnd, columnStart, columnEnd) {
    if (!(this instanceof TokenLocation)) {
        return new TokenLocation(rowStart, rowEnd, columnStart, columnEnd);
    }

    this.rowStart = rowStart;
    this.rowEnd = rowEnd;
    this.columnStart = columnStart;
    this.columnEnd = columnEnd;
}

function _update(newLocation, target) {
    if (this[target] !== newLocation[target]) {
        this[target] = newLocation[target];

        return true;
    }

    return false;
}

TokenLocation.prototype.update = function update(newLocation) {
    return _update.call(this, newLocation, 'rowStart') ||
           _update.call(this, newLocation, 'rowEnd') ||
           _update.call(this, newLocation, 'columnStart') ||
           _update.call(this, newLocation, 'columnEnd');
};

module.exports = TokenLocation;
