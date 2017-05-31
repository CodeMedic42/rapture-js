const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

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

function stop(control) {
    const data = control.data;

    if (!_.isNil(data.stop)) {
        data.stop();

        data.stop = null;
    }
}

function onStart(control, content) {
    const data = control.data;

    data.stop = Common.createListener(data.$shared.__keyData, 'change', null, evaluateForInvalidKeys.bind(null, control, content.contents, data.$shared.__keyData));
}

function onValid(control, content) {
    const contents = content.contents;

    if (_.isNil(contents) || !_.isPlainObject(contents)) {
        control.data.$shared.__keyData.pause();
    } else {
        control.data.$shared.__keyData.run();

        evaluateForInvalidKeys(control, contents, control.data.$shared.__keyData);
    }
}

const logic = Logic('raise', {
    options: {
        useToken: true
    },
    onStart,
    onValid,
    onStop: stop,
});

function strictAction(parentRule, actions) {
    const nextActions = _.clone(actions);

    return Rule('object-strict', logic, nextActions, parentRule);
}

module.exports = strictAction;
