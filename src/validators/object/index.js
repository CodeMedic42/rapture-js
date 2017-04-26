const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Observable = require('../../observable.js');

const keysAction = require('./keys.js');
const matchAction = require('./match.js');
const requiredAction = require('./required.js');
const nandAction = require('./nand.js');
const xorAction = require('./xor.js');
const withoutAction = require('./without.js');

const registerAction = require('../common/register.js');
const ifAction = require('../common/if.js');
const registeredAction = require('../common/registered.js');
const customAction = require('../common/custom.js');

function evaluateForInvalidKeys(context, contents, keyData) {
    const keyStates = {};
    let enabled = false;

    const data = keyData.toJS();

    _.forOwn(data, (ruleState) => {
        if (!ruleState) {
            return;
        }

        enabled = true;

        _.forOwn(ruleState, (propertyValue, propertyName) => {
            if (propertyValue) {
                keyStates[propertyName] = true;
            }
        });
    });

    if (!enabled) {
        context.raise();

        return;
    }

    const issues = _.reduce(contents, (issArray, propertyValue, propertyName) => {
        if (keyStates[propertyName]) {
            return issArray;
        }

        issArray.push({ type: 'schema', message: `The property "${propertyName}" is not allowed to exist.`, severity: 'error', from: propertyValue.from, location: propertyValue.location });

        return issArray;
    }, []);

    context.raise(issues);
}

const objectLogic = Logic({
    options: {
        useToken: true
    },
    onSetup: (context, content) => {
        const _context = context;

        _context.data.__keyData = Observable({
        }).on('change', function onChange() {
            evaluateForInvalidKeys(context, content.contents, this);
        });
    },
    onRun: (context, content) => {
        if (!_.isNil(content.contents) && !_.isPlainObject(content.contents)) {
            context.raise('schema', 'When defined this field must be a plain object', 'error');
        } else {
            context.raise();
            context.data.__keyData.unpause();

            evaluateForInvalidKeys(context, content.contents, context.data.__keyData);
        }
    },
    onPause: (context) => {
        context.data.__keyData.pause();
    }
});

const objectActions = {
    keys: keysAction,
    match: matchAction,
    nand: nandAction,
    xor: xorAction,
    without: withoutAction,
    required: requiredAction,
    register: registerAction,
    if: ifAction.bind(null, true),
    registered: registeredAction,
    custom: customAction
};

function objectDefinition(parentRule) {
    return Rule('object', objectLogic, objectActions, parentRule);
}

module.exports = objectDefinition;
