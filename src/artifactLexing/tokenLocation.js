function TokenLocation(rowStart, rowEnd, columnStart, columnEnd) {
    if (!(this instanceof TokenLocation)) {
        return new TokenLocation(rowStart, rowEnd, columnStart, columnEnd);
    }

    this.rowStart = rowStart;
    this.rowEnd = rowEnd;
    this.columnStart = columnStart;
    this.columnEnd = columnEnd;
}

module.exports = TokenLocation;
