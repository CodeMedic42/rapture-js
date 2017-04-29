const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function onTreeRaise(context, content, runningData) {
    if (!runningData.running) {
        return;
    }

    context.register(runningData.targetScope, runningData.id, runningData.targetValue, content.issues().length <= 0);
}

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
            onFaultChange: true,
            useToken: true
        },
        define: [{ id: 'registerID', value: id }],
        onSetup: (context, content) => {
            const runningData = {
                targetScope
            };

            if (when !== 'tree') {
                return runningData;
            }

            runningData.listener = onTreeRaise.bind(null, context, content, runningData);

            content.on('raise', runningData.listener);

            return runningData;
        },
        onRun: (context, content, params, currentValue) => {
            const _runningData = currentValue;

            if (!_.isNil(_runningData.id) && _runningData.id !== params.registerID) {
                // If the old id is not the same as the new one then we need to unregister the old id.
                context.unregister(targetScope, _runningData.id);
            }

            let targetValue = null;

            if (Object.prototype.hasOwnProperty.call(params, 'registerValue')) {
                targetValue = params.registerValue;
            } else {
                targetValue = content.getRaw();
            }

            const valueReady = when === 'always' || (when === 'this' && !context.isFaulted) || (when === 'tree' && content.issues().length <= 0);

            // create/update the value in the targetScope.
            context.register(targetScope, params.registerID, targetValue, valueReady);

            _runningData.id = params.registerID;
            _runningData.targetValue = targetValue;
            _runningData.running = true;

            return _runningData;
        },
        onPause: (context, content, currentValue) => {
            const _runningData = currentValue;

            _runningData.running = false;

            context.unregister(targetScope, _runningData.id);
        },
        onTeardown: (context, content, currentValue) => {
            const _runningData = currentValue;

            _runningData.running = false;

            context.unregister(targetScope, _runningData.id);

            if (!_.isNil(_runningData.listener)) {
                content.removeListener(_runningData.listener);
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
