const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function onReferenceUpdate(control, reference, item, token, onlyReference) {
    const data = control.data;

    if (!_.isNil(data.cleanUpDefined)) {
        data.cleanUpDefined();
    }

    const targetRef = reference.get(item);

    if (_.isNil(targetRef)) {
        control.raise({ type: 'schema', message: `${item} is not defined.`, severity: 'error' });
    } else {
        let referencedObserver = targetRef.get('referenced');
        let referencedListenerDisenguage;

        if (!onlyReference) {
            // Here we just need to make sure the value exists.
            control.clear();
        } else {
            // Here we need to make sure that we are the only reference.
            referencedListenerDisenguage = Common.createListener(referencedObserver, 'update', null, () => {
                if (referencedObserver.value() > 1) {
                    control.raise({ type: 'schema', message: 'Can only be referenced once.', severity: 'error', from: token.from, location: token.location });
                } else {
                    control.clear();
                }
            });
        }

        referencedObserver.set(referencedObserver.value() + 1);

        data.cleanUpDefined = () => {
            if (!_.isNil(referencedListenerDisenguage)) {
                referencedListenerDisenguage();
            }

            referencedObserver.set(referencedObserver.value() - 1);

            referencedObserver = null;

            data.cleanUpDefined = null;
        };
    }
}

function theLoop(reference, item, token, control, onlyReference) {
    const data = control.data;

    const boundOnReferenceUpdate = onReferenceUpdate.bind(null, control, reference, item, token, onlyReference);

    data.mainListenerDisenguage = Common.createListener(reference, 'update', null, boundOnReferenceUpdate, () => {
        if (!_.isNil(data.cleanUpDefined)) {
            data.cleanUpDefined();
        }

        data.mainListenerDisenguage = null;
    });

    boundOnReferenceUpdate();
}

function cleanUp(control) {
    if (!_.isNil(control.data.cleanUp)) {
        control.data.cleanUp();
    }
}

function onValid(control, content, params) {
    const data = control.data;

    if (!_.isString(content.contents)) {
        control.clear();

        return;
    }

    cleanUp(control);

    theLoop(params.refID, content.contents, content, control, data.onlyReference);

    data.cleanUp = () => {
        if (!_.isNil(data.mainListenerDisenguage)) {
            data.mainListenerDisenguage();
        }

        data.cleanUp = null;
    };
}

function fromReferenceAction(parentRule, actions, refereneId, onlyReference) {
    if (!_.isString(refereneId) && !(refereneId instanceof Logic)) {
        throw new Error('refereneId must be a string');
    }

    const logic = Logic('raise', {
        options: {
            data: {
                onlyReference
            },
            content: {
                asToken: true
            }
        },
        require: { id: 'refID', value: refereneId },
        onValid,
        onInvalid: cleanUp,
        onStop: cleanUp,
        onDispose: cleanUp
    });

    const nextActions = _.clone(actions);

    return Rule('string-max', logic, nextActions, parentRule);
}

module.exports = fromReferenceAction;
