const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');

function validatedValidData(validData, allowLogic) {
    if (_.isArray(validData)) {
        _.forEach(validData, (item) => {
            if (!_.isString(item)) {
                throw new Error('Must be an array of strings');
            }
        });

        return validData;
    } else if (_.isString(validData)) {
        return [validData];
    } else if (_.isString(validData instanceof Logic) && allowLogic) {
        return validData;
    }

    throw new Error('Must be a string, an array of strings, or a Rapture logic instance');
}

function validAction(parentRule, actions, validData) {
    const _validData = validatedValidData(validData, true);

    const logic = Logic({
        define: { id: 'validData', value: _validData },
        onRun: (context, contents, params) => {
            context.raise();

            if (!_.isString(contents)) {
                return;
            }

            const finalData = validatedValidData(params.validData, false);

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
