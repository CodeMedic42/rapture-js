const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function evaluateForInvalidKeys(control, contents, keyData) {
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

    control.raise(issues);
}

function strictAction(parentRule, actions) {
    const logic = Logic({
        options: {
            useToken: true
        },
        onSetup: (control, content) => {
            control.data.__keyData
            .on('change', function onChange() {
                evaluateForInvalidKeys(control, content.contents, this);
            });
        },
        onRun: (control, content) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                control.data.__keyData.pause();
            } else {
                control.data.__keyData.run();

                evaluateForInvalidKeys(control, contents, control.data.__keyData);
            }
        },
        onPause: (control) => {
            control.data.__keyData.pause();
        },
        onTeardown: (control) => {
            control.data.__keyData.pause();
        }
    });

    const nextActions = _.clone(actions);

    return Rule('object-strict', logic, nextActions, parentRule);
}

module.exports = strictAction;
