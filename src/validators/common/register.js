const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function registerAction(parentRule, actions, data) {
    let id = data;
    let targetScope = null;
    let value = null;
    let when = null;

    if (_.isPlainObject(data)) {
        id = data.id;
        targetScope = data.scope;
        value = data.value;
        when = data.when;
    }

    if (!_.isString(id) && !(id instanceof Logic)) {
        throw new Error('ID must be a string or an Rapture logic object which results in a string');
    }

    if (!_.isNil(targetScope) && !_.isString(targetScope)) {
        throw new Error('When defined scope must be a string');
    }

    if (_.isNil(when)) {
        when = 'this';
    } else if (when !== 'always' && when !== 'this' && when !== 'tree') {
        throw new Error('When defined targetScope must be a string');
    }

    const logicComponents = {
        options: {
            onStateChange: true,
            useToken: true,
            runOnFailure: true
        },
        define: [{ id: 'registerID', value: id }],
        onSetup: (control, content) => {
            const _control = control;

            const runningData = _control.data[control.id] = {
                targetScope,
                running: false
            };

            if (when !== 'tree') {
                return;
            }

            runningData.disenguage = Common.createListener(content, 'update', null, () => {
                if (!runningData.running) {
                    return;
                }

                control.register(runningData.targetScope, runningData.id, runningData.getTargetValue(), runningData.getReadyStatus(), true);
            });
        },
        onRun: (control, content, params) => {
            const runningData = control.data[control.id];

            runningData.running = false;

            if (!_.isNil(runningData.id) && runningData.id !== params.registerID) {
                // If the old id is not the same as the new one then we need to unregister the old id.
                control.unregister(targetScope, runningData.id);
            }

            runningData.getReadyStatus = () => {
                return control.paramState === 'passing' && (when === 'always' ||
                        (when === 'this' && control.state === 'passing') ||
                        (when === 'tree' && content.issues().length <= 0 && control.state === 'passing'));
            };

            runningData.getTargetValue = () => {
                return _.isNil(value) ? content.getRaw() : params.registerValue;
            };

            const valueReady = runningData.getReadyStatus();
            const targetValue = runningData.getTargetValue();

            if (!_.isNil(params.registerID)) {
                // create/update the value in the targetScope.
                control.register(targetScope, params.registerID, targetValue, valueReady, true);

                runningData.id = params.registerID;
                runningData.targetValue = targetValue;
                runningData.running = true;
            } else {
                runningData.running = false;
            }
        },
        onPause: (control) => {
            const runningData = control.data[control.id];

            runningData.running = false;

            if (!_.isNil(runningData.id)) {
                control.unregister(targetScope, runningData.id);
            }
        },
        onTeardown: (control) => {
            const runningData = control.data[control.id];

            runningData.running = false;

            if (!_.isNil(runningData.id)) {
                control.unregister(targetScope, runningData.id);
            }

            if (!_.isNil(runningData.disenguage)) {
                runningData.disenguage();
            }
        }
    };

    if (!_.isNil(value)) {
        logicComponents.define.push({ id: 'registerValue', value });
    }

    const logic = Logic(logicComponents);

    return Rule('register', logic, actions, parentRule);
}

module.exports = registerAction;
