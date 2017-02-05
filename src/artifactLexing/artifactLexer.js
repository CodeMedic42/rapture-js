const JsonLexer = require('json-lexer');
const _ = require('lodash');
const LexingContext = require('./lexingContext.js');
const TokenContext = require('./tokenContext.js');
const TokenLocation = require('./tokenLocation.js');
const Issue = require('../issue.js');

function processProperty(lexingContext, from, complexOnly) {
    let token = lexingContext.next();

    let contents = null;

    if (token.type === 'punctuator') {
        if (token.raw === '{') {
            contents = processObject(lexingContext, from);
        } else if (token.raw === '[') {
            contents = processArray(lexingContext, from);
        } else {
            throw Issue('parsing', token.type, token.location, 'Invalid start punctuator');
        }
    } else if (!complexOnly){
        if (token.type === 'string') {
            contents = token.value;
        } else if (token.type === 'number') {
            contents = token.value;
        } else if (token.type === 'literal') {
            contents = token.value;
        } else {
            throw Error(`No idea what is going on here. Got a toke type of ${token.type}`);
        }
    } else {
        throw Issue('parsing', token.type, token.location, 'Invalid token type');
    }

    return contents;
}

function processObject(lexingContext, from) {
    const target = {};

    let propertyNameToken = lexingContext.next();

    if (propertyNameToken.type === 'punctuator') {
        if (propertyNameToken.raw === '}') {
            return target;
        }

        throw Issue('parsing', propertyNameToken.type, propertyNameToken.location, 'Must be a string for a property or an end tag for the object.');
    }

    while (true) {
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

        const newFrom = from.length <= 0 ? `${propertyName}` : `${from}.${propertyName}`
        const contents = processProperty(lexingContext, newFrom, false);

        target[propertyName] = TokenContext(contents, propertyNameToken.location, newFrom);

        endPuncToken = lexingContext.next();

        if (endPuncToken.type === 'punctuator') {
            if (endPuncToken.raw === '}') {
                break;
            } else if (endPuncToken.raw !== ',') {
                throw Issue('parsing', endPuncToken.type, endPuncToken.location, 'Expecting "}" or ","');
            }
        }

        propertyNameToken = lexingContext.next();
    }

    return target;
}

function processArray(lexingContext, from) {
    const target = [];

    let currentToken = lexingContext.next();

    if (currentToken.type === 'punctuator') {
        if (currentToken.raw === ']') {
            return target;
        }

        throw Issue('parsing', currentToken.type, currentToken.location, 'Must be a valid array item or an end tag for the array.');
    }

    while (true) {
        const tokenRowStart = currentToken.location.rowStart;
        const tokenColumnStart = currentToken.location.columnStart;

        const indexLocation = TokenLocation(tokenRowStart, tokenRowStart, tokenColumnStart, tokenColumnStart);

        const newFrom = from.length <= 0 ? `${target.length}` : `${from}.${target.length}`;

        const contents = processProperty(lexingContext, newFrom, false);

        target.push(TokenContext(contents, indexLocation, newFrom));

        endPuncToken = lexingContext.next();

        if (endPuncToken.type === 'punctuator') {
            if (endPuncToken.raw === ']') {
                break;
            } else if (endPuncToken.raw !== ',') {
                throw Issue('parsing', endPuncToken.type, endPuncToken.location, 'Expecting "]" or ","');
            }
        }

        currentToken = lexingContext.next();
    }

    return target;
}

module.exports = function ArtifactLexer(artifact) {
    const contents = processProperty(LexingContext(artifact), '', false);

    return TokenContext(contents, TokenLocation(0, 0, 0, 0), '');
};
