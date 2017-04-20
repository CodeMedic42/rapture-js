const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const Common = require('../../common.js');

function cleanLogicData(logicData, allowLogic) {
    if (logicData[0] instanceof Logic) {
        if (!allowLogic) {
            throw new Error('Rapture logic objects are not allowed.');
        } else if (logicData.length > 1) {
            throw new Error('Only one value should be given when using a Rapture logic object.');
        }

        return logicData[0];
    }

    return Common.flattenWith(logicData, (data) => {
        if (!_.isString(data)) {
            throw new Error('All static items must be either arrays or strings');
        }

        return data;
    });
}

function validAction(parentRule, actions, ...initalLogicData) {
    if (_.isNil(initalLogicData)) {
        return parentRule;
    }

    const logicData = cleanLogicData(initalLogicData, true);

    const logic = Logic({
        define: { id: 'logicData', value: logicData },
        onRun: (context, contents, params) => {
            context.raise();

            if (!_.isString(contents)) {
                return;
            }

            const finalData = cleanLogicData([params.logicData], false);

            let isValid = false;

            _.forEach(finalData, (item) => {
                if (contents === item) {
                    isValid = true;
                }

                return !isValid;
            });

            if (!isValid) {
                context.raise('schema', `Must be one of ${JSON.stringify(finalData)}`, 'error');
            }
        }
    });

    const nextActions = _.clone(actions);

    return Rule('string-max', logic, nextActions, parentRule);
}

module.exports = validAction;
