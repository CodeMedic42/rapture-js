const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function cleanLogicData(logicData) {
    return Common.flattenWith(logicData, (data) => {
        if (!_.isString(data)) {
            throw new Error('All static items must be either arrays or strings');
        }

        return data;
    });
}

function onValid(control, content) {
    const data = control.data;

    const contents = content.contents;

    if (!_.isPlainObject(contents)) {
        return;
    }

    control.clear();

    if (_.isNil(contents[data.key])) {
        // key does not exist so there is nothing check for.
        return;
    }

    const presentItems = [];

    _.forEach(data.without, (item) => {
        if (Object.prototype.hasOwnProperty.call(contents, item)) {
            presentItems.push(contents[item]);
        }
    });

    if (presentItems.length > 0) {
        const issues = [];

        _.forEach(presentItems, (item) => {
            issues.push({
                type: 'schema',
                message: `Cannot exist when "${data.key}" exists`,
                severity: 'error',
                from: item.from,
                location: item.location
            });

            control.raise(issues);
        });
    }
}

module.exports = (parentRule, actions, key, ...initalLogicData) => {
    if (_.isNil(initalLogicData)) {
        return parentRule;
    }

    if (!_.isString(key)) {
        throw new Error('Key must be a string');
    }

    const without = cleanLogicData(initalLogicData);

    const logic = Logic('raise', {
        options: {
            data: {
                key,
                without
            },
            content: {
                asToken: true
            }
        },
        onValid
    });

    const nextActions = _.clone(actions);

    return Rule('object-without', logic, nextActions, parentRule);
};
