const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function cleanProperties(logicData) {
    return Common.flattenWith(logicData, (data) => {
        if (!_.isString(data)) {
            throw new Error('All static items must be either arrays or strings');
        }

        return data;
    });
}

function onValid(control, content) {
    if (!_.isPlainObject(content.contents)) {
        return;
    }

    const presentItems = [];

    _.forEach(control.data.properties, (item) => {
        if (Object.prototype.hasOwnProperty.call(content.contents, item)) {
            presentItems.push(content.contents[item]);
        }
    });

    if (presentItems.length > 1) {
        const issues = [];

        _.forEach(presentItems, (item) => {
            issues.push({
                type: 'schema',
                message: `Only one of ${JSON.stringify(control.data.properties)} is allowed`,
                severity: 'error',
                from: item.from,
                location: item.location
            });

            control.raise(issues);
        });
    } else if (presentItems.length < 1) {
        control.raise('schema', `One of ${JSON.stringify(control.data.properties)} is required`, 'error');
    } else {
        control.clear();
    }
}

module.exports = (parentRule, actions, ...properties) => {
    if (_.isNil(properties)) {
        throw new Error('xor requires properties');
    }

    const logic = Logic('raise', {
        options: {
            data: {
                properties: cleanProperties(properties)
            },
            content: {
                asToken: true
            }
        },
        onValid
    });

    const nextActions = _.clone(actions);

    return Rule('object-xor', logic, nextActions, parentRule);
};
