const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function cleanLogicData(logicData, allowArray) {
    if (_.isString(logicData)) {
        const cb = item => item === logicData;

        return allowArray ? [cb] : cb;
    } else if (_.isRegExp(logicData)) {
        const cb = item => item.match(logicData);

        return allowArray ? [cb] : cb;
    }

    if (_.isArray(logicData)) {
        if (allowArray) {
            return _.reduce(logicData, (builder, item) => {
                builder.push(cleanLogicData(item, false, false));

                return builder;
            }, []);
        }

        throw new Error('An array is not allowed inside of another array.');
    }

    throw new Error('Must be either a string, regular expression, an array of the former two, or a Rapture Logic definition if not already loaded through one.');
}

function invalidAction(parentRule, actions, logicData) {
    if (_.isNil(logicData)) {
        return parentRule;
    }

    let cleanedLogic;
    let needsCleaned = true;

    if (logicData instanceof Logic) {
        cleanedLogic = logicData;
    } else {
        cleanedLogic = cleanLogicData(logicData, true);
        needsCleaned = false;
    }

    const logic = Logic({
        options: {
            useToken: true
        },
        define: { id: 'keys', value: cleanedLogic },
        onRun: (context, content, params) => {
            const contents = content.contents;

            if (_.isNil(contents) || !_.isPlainObject(contents)) {
                // Do nothing
                return;
            }

            let keys = params.keys;

            if (needsCleaned) {
                keys = cleanLogicData(keys, true, false);
            }
            // TODO Work on creating this isStatic part
            // if (context.params && !context.params[keys].isStatic) {
            // }

            const issues = [];

            _.forOwn(contents, (property, name) => {
                const index = _.findIndex(keys, key => key(name));

                if (index >= 0) {
                    issues.push({ type: 'schema', message: `The property "${name}" is not allowed to exist.`, severity: 'error', from: property.from, location: property.location });
                }
            });

            context.raise(issues);
        }
    });

    const nextActions = _.clone(actions);

    return Rule('object-invalid', logic, 'full', nextActions, parentRule);
}

module.exports = invalidAction;
