const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function evaluateForInvalidKeys(control, contentContext, keyData) {
    const contents = contentContext.contents;
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

function onBuild(control) {
    const data = control.data;

    data.validate = evaluateForInvalidKeys.bind(null, control, control.contentContext, data.$shared.__keyData);

    data.stop = Common.createListener(data.$shared.__keyData, 'change', null, data.validate);
}

function onValid(control, content) {
    const contents = content.contents;
    const data = control.data;

    if (_.isNil(contents) || !_.isPlainObject(contents)) {
        control.data.$shared.__keyData.pause();
    } else {
        control.data.$shared.__keyData.run();

        data.validate();
    }
}

function onInvalid(control) {
    control.data.$shared.__keyData.pause();
}

function onStop(control) {
    control.data.$shared.__keyData.pause();
}

function onDispose(control) {
    const data = control.data;

    if (!_.isNil(data.stop)) {
        data.stop();

        data.stop = null;
    }

    data.validate = null;
}

const logic = Logic('raise', {
    options: {
        content: {
            asToken: true
        }
    },
    onBuild,
    onValid,
    onInvalid,
    onStop,
    onDispose,
});

function strictAction(parentRule, actions) {
    const nextActions = _.clone(actions);

    return Rule('object-strict', logic, nextActions, parentRule);
}

module.exports = strictAction;
