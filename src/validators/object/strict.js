const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function evaluateForInvalidKeys(context, contents, keyData) {
    const keyStates = {};

    const data = keyData.value();

    _.forOwn(data, (ruleState) => {
        if (!ruleState) {
            return;
        }

        _.forOwn(ruleState, (propertyValue, propertyName) => {
            if (propertyValue) {
                keyStates[propertyName] = true;
            }
        });
    });

    const issues = _.reduce(contents, (issArray, propertyValue, propertyName) => {
        if (keyStates[propertyName]) {
            return issArray;
        }

        issArray.push({ type: 'schema', message: `The property "${propertyName}" is not allowed to exist.`, severity: 'error', from: propertyValue.from, location: propertyValue.location });

        return issArray;
    }, []);

    context.raise(issues);
}

function strictAction(parentRule, actions) {
    const logic = Logic({
        options: {
            useToken: true
        },
        onSetup: (context, content) => {
            context.data.__keyData
            .on('change', function onChange() {
                evaluateForInvalidKeys(context, content.contents, this);
            });
        },
        onRun: (context, content) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                context.data.__keyData.pause();
            } else {
                context.data.__keyData.run();

                evaluateForInvalidKeys(context, contents, context.data.__keyData);
            }
        },
        onPause: (context) => {
            context.data.__keyData.pause();
        },
        onTeardown: (context) => {
            context.data.__keyData.pause();
        }
    });

    const nextActions = _.clone(actions);

    return Rule('object-strict', logic, 'full', nextActions, parentRule);
}

module.exports = strictAction;
