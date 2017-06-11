const _ = require('lodash');
const Rule = require('../../rule.js');
const Logic = require('../../logic.js');
const registerAction = require('./register.js');

module.exports = function setup(rapture) {
    let buildRule = null;

    function buildKeys(properties) {
        const keys = {};

        _.forOwn(properties, (def, name) => {
            keys[name] = buildRule(def);
        });

        return keys;
    }

    buildRule = (schema) => {
        let rule = null;

        if (schema.type === 'object') {
            rule = rapture.object()
            .keys(buildKeys(schema.properties));
        } else if (schema.type === 'array') {
            rule = rapture.array()
            .items(buildRule(schema.items));
        } else if (schema.type === 'string') {
            rule = rapture.string();
        } else if (schema.type === 'number') {
            rule = rapture.number();
        } else if (schema.type === 'boolean') {
            rule = rapture.boolean();
        } else if (schema.type === 'date') {
            rule = rapture.date();
        } else {
            throw new Error('Not Implemented');
        }

        return rule;
    };

    function cleanUp(control) {
        const data = control.data;

        if (!_.isNil(data.context)) {
            data.context.dispose().commit();

            data.context = null;
        }
    }

    function onValid(control, content, params) {
        const data = control.data;

        cleanUp(control);

        let schema = params.schema;

        if (_.isString(schema)) {
            schema = JSON.parse(schema);
        } else if (!_.isPlainObject(schema)) {
            throw new Error('Schema must be a string or an object');
        }

        const rule = buildRule(schema);

        const RuleContext = require('../../ruleContext.js'); // eslint-disable-line

        data.context = RuleContext(control.contentContext, rule, control.scope);

        control.contentContext.addRuleContext(data.context);
    }

    return (schemaInput) => {
        let schema = schemaInput;

        if (_.isString(schema)) {
            schema = JSON.parse(schema);
        } else if (!_.isPlainObject(schema) && !(schema instanceof Logic)) {
            throw new Error('Schema argument must be a string, object, or a Rapture logic object');
        }

        const logicComponents = {
            define: { id: 'schema', value: schema },
            onValid,
            onInvalid: cleanUp,
            onStop: cleanUp,
            onDispose: cleanUp
        };

        return Rule('fromSchema', Logic('full', logicComponents), {
            register: registerAction
        });
    };
};
