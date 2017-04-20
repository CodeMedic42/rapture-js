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

function nandAction(parentRule, actions, ...initalLogicData) {
    const logicData = cleanLogicData(initalLogicData);

    const logic = Logic({
        onRun: (context, content) => {
            if (!_.isPlainObject(content)) {
                return;
            }

            context.raise();

            const presentItems = [];

            _.forEach(logicData, (item) => {
                if (Object.prototype.hasOwnProperty.call(content, item)) {
                    presentItems.push(content[item]);
                }
            });

            if (presentItems.length >= 2) {
                const issues = [];

                _.forEach(presentItems, (item) => {
                    issues.push({
                        type: 'schema',
                        message: `${JSON.stringify(logicData)} cannot all exist at the same time.`,
                        severity: 'error',
                        from: item.from,
                        location: item.location
                    });

                    context.raise(issues);
                });
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('string-min', logic, nextActions, parentRule);
}

module.exports = nandAction;
