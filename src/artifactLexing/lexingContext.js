const JsonLexer = require('json-lexer');
const _ = require('lodash');
const TokenLocation = require('./tokenLocation');

function LexingContext(artifact) {
    if (!(this instanceof LexingContext)) {
        return new LexingContext(artifact);
    }

    this.tokens = JsonLexer(artifact, { throwOnError: false });
    this.index = -1;
}

function calculateLocation(tokens, targetIndex) {
    const token = tokens[targetIndex];

    if (!_.isNil(token.location)) {
        return token;
    }

    let previousLocation = null;

    if (targetIndex > 0) {
        previousLocation = tokens[targetIndex - 1].location;
    } else {
        previousLocation = TokenLocation(0, 0, 0, 0);
    }

    // We should have at least one line
    const lines = token.raw.split(/\r\n|\r|\n/g);

    // There HAS to be at least one item in the array.
    if (lines.length <= 0) {
        throw new Error('The number of lines is too few');
    }

    // We are going to need to keep track of length
    const columnEnd = lines.length === 1 ?
        // if there is only one line then we have not left the current line yet.
        // Just add to what we have recorded.
        previousLocation.columnEnd + lines[0].length :
        // We are dealing with multiple lines.
        // We end on the length of the last item.
        lines[lines.length - 1].length;

    // If we only have one line then we are no
    const rowEnd = (previousLocation.rowEnd + lines.length) - 1;

    token.location = TokenLocation(previousLocation.rowEnd, rowEnd, previousLocation.columnEnd, columnEnd);

    return token;
}

LexingContext.prototype.current = function current() {
    const targetIndex = this.index;

    if (targetIndex < 0) {
        throw new Error('Must call next first');
    }

    return calculateLocation(this.tokens, targetIndex);
};

LexingContext.prototype.peak = function peak() {
    let targetIndex = this.index + 1;

    let token = calculateLocation(this.tokens, targetIndex);

    while (token.type === 'whitespace') {
        targetIndex += 1;

        token = calculateLocation(this.tokens, targetIndex);
    }

    return token;
};

LexingContext.prototype.next = function next() {
    this.index += 1;

    let current = this.current();

    while (current.type === 'whitespace') {
        this.index += 1;
        current = this.current();
    }

    return current;
};

module.exports = LexingContext;
