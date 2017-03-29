const _ = require('lodash');
const Rule = require('../../rule.js');
const LogicDefinition = require('../../logicDefinition.js');

function requiredAction(parentRule, actions, ...requiredKeys) {
    let keysList = requiredKeys;

    if (requiredKeys.length <= 0) {
        throw new Error('Must provide a list of required keys');
    }

    if (_.isFunction(requiredKeys[0])) {
        if (requiredKeys.length > 1) {
            throw new Error('If providing a setup function no other parameters are allowed.');
        }

        keysList = requiredKeys[0];
    } else if (_.isArray(requiredKeys[0])) {
        if (requiredKeys.length > 1) {
            throw new Error('If providing an array of keys no other parameters are allowed.');
        }

        keysList = requiredKeys[0];
    }

    const logicDefinition = LogicDefinition((setupContext) => {
        setupContext.define('requiredKeys', keysList);

        setupContext.onRun((runContext, value, params) => {
            const issues = [];

            runContext.raise();

            if (!_.isPlainObject(value)) {
                return;
            }

            _.forEach(params.requiredKeys, (keyName) => {
                const target = value[keyName];
                const targetContents = _.isNil(target) ? target : target.contents;

                if (_.isNil(targetContents)) {
                    const issue = { type: 'schema', message: `The property "${keyName}" is required`, severity: 'error' };

                    if (targetContents === null) {
                        issue.from = target.from;
                        issue.location = target.location;
                    }

                    issues.push(issue);
                }
            });

            runContext.raise(issues);
        });
    });

    return Rule(logicDefinition, actions, parentRule);
}

module.exports = requiredAction;
