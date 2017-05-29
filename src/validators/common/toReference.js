const _ = require('lodash');
const Rule = require('../../rule.js');
const Common = require('../../common.js');
const Logic = require('../../logic.js');

function cleanUpSub(disenguageReferenceener, currentCount, reference, item) {
    if (!_.isNil(disenguageReferenceener)) {
        disenguageReferenceener();
    }

    const newValue = currentCount.value() - 1;

    if (newValue > 0) {
        currentCount.set(newValue);
    } else {
        reference.delete(item);
    }

    currentCount.dispose();
}

function theLoop(reference, item, token, control, unique) {
    let currentCount = reference.get(item);

    if (_.isNil(currentCount)) {
        reference.set(item, {
            defined: 0,
            referenced: 0
        });

        currentCount = reference.get(`${item}.defined`);
    } else {
        currentCount = currentCount.get('defined');
    }

    let disenguageReferenceener;

    if (unique) {
        disenguageReferenceener = Common.createListener(currentCount, 'change', null, () => {
            if (currentCount.value() > 1) {
                control.raise({ type: 'schema', message: 'Must be a unique id.', severity: 'error', from: token.from, location: token.location });
            } else {
                control.clear();
            }
        });
    }

    currentCount.set(currentCount.value() + 1);

    return cleanUpSub.bind(null, disenguageReferenceener, currentCount, reference, item);
}

function cleanUp(control) {
    const data = control.data;

    if (!_.isNil(data.cleanUp)) {
        data.cleanUp();

        data.cleanUp = null;
    }
}

function toReferenceAction(parentRule, actions, referenceId, unique) {
    const logic = Logic('raise', {
        options: {
            useToken: true
        },
        require: { id: 'referenceId', value: referenceId },
        // onSetup: (control) => {
        //     const _control = control;
        //
        //     _control.data[control.id] = {};
        // },
        onValid: (control, content, params) => {
            const data = control.data;

            cleanUp(control);

            data.ran = true;

            const cleanUpReference = [];

            if (_.isPlainObject(content.contents)) {
                _.forOwn(content.contents, (item, name) => {
                    cleanUpReference.push(theLoop(params.referenceId, name, item, control, unique));
                });
            } else if (!_.isNil(content.contents)) {
                cleanUpReference.push(theLoop(params.referenceId, content.contents, content, control, unique));
            }

            data.cleanUp = () => {
                data.ran = false;

                _.forEach(cleanUpReference, cleanUpCb => cleanUpCb());
            };
        },
        onmInvalid: cleanUp,
        onStop: cleanUp,
        onDispose: cleanUp
    });

    return Rule('toReference', logic, actions, parentRule);
}

module.exports = toReferenceAction;
