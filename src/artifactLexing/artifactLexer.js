const _ = require('lodash');
const LexingContext = require('./lexingContext.js');
const TokenContext = require('./tokenContext.js');
const TokenLocation = require('./tokenLocation.js');
const Issue = require('../issue.js');

let _processObject;
let _processArray;

function processProperty(lexingContext, from, complexOnly) {
    const token = lexingContext.next();

    let contents = null;

    if (token.type === 'punctuator') {
        if (token.raw === '{') {
            contents = _processObject(lexingContext, from); // eslint-disable-line
        } else if (token.raw === '[') {
            contents = _processArray(lexingContext, from); // eslint-disable-line
        } else {
            throw Issue('parsing', token.type, token.location, 'Invalid start punctuator');
        }
    } else if (!complexOnly) {
        if (!_.isNil(token.issue)) {
            const newLocation = TokenLocation(token.location.rowStart, token.location.rowEnd, token.location.columnStart + token.issue.start, token.location.columnStart + token.issue.start + token.issue.length);

            throw Issue('parsing', token.type, newLocation, token.issue.message);
        }

        if (token.type === 'string') {
            contents = token.value;
        } else if (token.type === 'number') {
            contents = token.value;
        } else if (token.type === 'literal') {
            contents = token.value;
        } else if (token.type === 'end') {
            throw Issue('parsing', null, token.location, 'Unexpected end of file');
        } else {
            throw Error(`No idea what is going on here. Got a toke type of ${token.type}`);
        }
    } else {
        throw Issue('parsing', token.type, token.location, 'Invalid token type');
    }

    return contents;
}

_processObject = function processObject(lexingContext, from) {
    const target = {};

    let propertyNameToken = lexingContext.next();

    if (propertyNameToken.type === 'punctuator') {
        if (propertyNameToken.raw === '}') {
            return target;
        }

        throw Issue('parsing', propertyNameToken.type, propertyNameToken.location, 'Must be a string for a property or an end tag for the object.');
    }

    while (true) { // eslint-disable-line no-constant-condition
        if (!_.isNil(propertyNameToken.issue)) {
            const newLocation = TokenLocation(propertyNameToken.location.rowStart, propertyNameToken.location.rowEnd, propertyNameToken.location.columnStart + propertyNameToken.issue.start, propertyNameToken.location.columnStart + propertyNameToken.issue.start + propertyNameToken.issue.length);

            throw Issue('parsing', propertyNameToken.type, newLocation, propertyNameToken.issue.message);
        }

        if (propertyNameToken.type !== 'string') {
            // Must be a property which is a string.
            throw Issue('parsing', propertyNameToken.type, propertyNameToken.location, 'Must be a string if not ending an object');
        }

        const propertyName = propertyNameToken.value;

        if (!_.isNil(target[propertyName])) {
            throw Issue('parsing', propertyNameToken.type, propertyNameToken.location, 'Duplicate Property Name');
        }

        const propPuncToken = lexingContext.next();

        if (propPuncToken.type !== 'punctuator' || propPuncToken.raw !== ':') {
            // Must be a property which is a string.
            throw Issue('parsing', propPuncToken.type, propPuncToken.location, 'Missing ":"');
        }

        const newFrom = from.length <= 0 ? `${propertyName}` : `${from}.${propertyName}`;
        const contents = processProperty(lexingContext, newFrom, false);

        target[propertyName] = TokenContext(contents, propertyNameToken.location, newFrom);

        const endPuncToken = lexingContext.next();

        if (endPuncToken.type === 'punctuator') {
            if (endPuncToken.raw === '}') {
                break;
            } else if (endPuncToken.raw !== ',') {
                throw Issue('parsing', endPuncToken.type, endPuncToken.location, 'Expecting "}" or ","');
            }
        } else {
            throw Issue('parsing', endPuncToken.type, endPuncToken.location, 'Expecting "}" or ","');
        }

        propertyNameToken = lexingContext.next();
    }

    return target;
};

_processArray = function processArray(lexingContext, from) {
    const target = [];

    let nextToken = lexingContext.peak();

    if (nextToken.type === 'punctuator') {
        if (nextToken.raw === ']') {
            lexingContext.next();
            return target;
        } else if (nextToken.raw !== '{') {
            throw Issue('parsing', nextToken.type, nextToken.location, 'Must be a valid array item or an end tag for the array.');
        }
    }

    while (true) { // eslint-disable-line no-constant-condition
        const tokenRowStart = nextToken.location.rowStart;
        const tokenColumnStart = nextToken.location.columnStart;

        const indexLocation = TokenLocation(tokenRowStart, tokenRowStart, tokenColumnStart, tokenColumnStart);

        const newFrom = from.length <= 0 ? `${target.length}` : `${from}.${target.length}`;

        const contents = processProperty(lexingContext, newFrom, false);

        target.push(TokenContext(contents, indexLocation, newFrom));

        const endPuncToken = lexingContext.next();

        if (endPuncToken.type === 'punctuator') {
            if (endPuncToken.raw === ']') {
                break;
            } else if (endPuncToken.raw !== ',') {
                throw Issue('parsing', endPuncToken.type, endPuncToken.location, 'Expecting "]" or ","');
            }
        }

        nextToken = lexingContext.peak();
    }

    return target;
};

module.exports = function ArtifactLexer(artifact) {
    const contents = processProperty(LexingContext(artifact), '', false);

    return TokenContext(contents, TokenLocation(0, 0, 0, 0), '');
};
