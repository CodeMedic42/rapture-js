const standardPropertyPattern = /^[-\w\d]+$/;
const specialPropertyPattern = /^[-\w\d:]+$/;

function checkForCircularReference(runContext, parentRefs) {
    // Check Circular dependancy.
    const index = _.findIndex(parentRefs, by => by === this.params.lookingFor);

    if (index >= 0) {
        runContext.raise('circularReference', 'Cannot have a circular reference.');

        runContext.params.targetRefs.merge(parentRefs);
    } else {
        runContext.clear();

        // This probably will not work could conflict with others.
        // Need to splend some time to think about this.
        runContext.params.targetRefs.remove(parentRefs);
    }
}

function circOnRun(runContext, componentId) {
    runContext.params.lookingFor = `${runContext.params.componentType}/${componentId}`;

    runContext.params.references.off('change', checkForCircularReference, runContext);
    runContext.params.references.on('change', checkForCircularReference, runContext);

    checkForCircularReference(runContext, runContext.params.references);
}

function circOnPause(runContext) {
    runContext.referencedBy.off('change', refByOnChange, this);
}

function buildRulesRule(conditionRequired) {
    let ruleSchema = null;

    const ruleArray = rapture.array().items(rapture.defer(() => ruleSchema));

    const expression = rapture.string().min(1);

    const expressionArray = rapture.array().items(expression).min(1);

    const action = rapture.is(rapture.string(), expression)
                        .elseIs(rapture.array(), expressionArray),
                        .elseIs(rapture.object(),rapture.object().keys({
                                expression: rapture.is(rapture.string(), expression)
                                                 .elseIs(rapture.array(), expressionArray),
                                then: rapture.defer(() => ruleSchema),
                                catch: rapture.defer(() => ruleSchema)
                            }).required('expression');
                        );

    const ruleObject = rapture.object().keys({
        condition: conditionRequired ? conditionSchema : conditionSchema.allow(null),
        action,
        parallel: ruleArray,
        series: ruleArray,
        oneOf: ruleArray
    })
    .xor('parallel', 'oneOf', 'series', 'action')
    .without('condition', 'parallel', 'oneOf', 'series');

    if (conditionRequired) {
        ruleObject = ruleObject.with('action', 'condition');
    }

    ruleSchema = rapture.is(rapture.string(), => expression)
                      .elseIs(rapture.object(), ruleObject)
                      .elseIs(rapture.array(), expressionArray);

    return ruleSchema;
}

function buildHandlersSchema(commandsAllowed, routesAllowed) {
    const keys = {
        expression: rulesSchema(false),
        output: rapture.object().keys({
            [standardPropertyPattern]: rapture.any()
        })
    };

    if (routesAllowed) {
        keys.route = rapture.string().allow('').defined([(routeID) => `route/${routeID}`]);
    }

    if (commandsAllowed) {
        keys.command = rapture.string().defined([(commandID) => `command/${commandID}`]);;
    }

    let handlerSchema = rapture.object().keys(keys);

    if (routesAllowed && commandsAllowed) {
        handlerSchema = handlerSchema.nand('command', 'route');
    }

    return rapture.object().keys({
        [standardPropertyPattern]: handlerSchema
    });
}

function buildAssetRule(commandsAllowed, routesAllowed, assetBindingTypeRule)
    return rapture.object(rapture.scope('asset')).keys({
        id: rapture.string().define('bindingID', 'asset'),
        component: rapture.object().keys({
            id: rapture.string()
                .custom((setupContext) => {
                    setupContext.require('fullArtifactID');
                    setupContext.require('references');
                    setupContext.require('componentType');
                    setupContext.require('targetRefs', (refsetupContext) => {
                        refsetupContext.require('componentType');
                        refsetupContext.onRun(function targetRefsOnRun(componentId) {
                            return `${this.params.componentType}/${componentId}.referencedBy`;
                        });
                    });
                    //this.require('targetRefs', '${componentType}/${this}.referencedBy');

                    setupContext.onRun(circOnRun);
                    setupContext.onPause(circOnPause);
                })
                .define('componentId', 'asset')
            type: assetBindingTypeRule.define('componentType', 'asset'),
            version: rapture.version()
        }).required('id', 'type', 'version'),
        input: Joi.object()
        .custom((setupContext) => {
            setupContext.require('destionationModel', '${componentType}/${componentId}.model');
            setupContext.require('sourceModel', 'artifactModel');

            setupContext.onRun(function bindingOnRun(tokenContext) {
            });

            setupContext.onPause(function bindingOnPause() {
            });
        });
        handlers: buildHandlersSchema(commandsAllowed, routesAllowed);
    })
    .required('id', 'component', 'input', 'handlers');
    .define(['bindingId', (bindingId) => `asset/${bindingId}`], 'artifact')
    .define(['bindingId', (bindingId) => `asset/${bindingId}/bindingId`], 'artifact', '${componentType}/${componentId}');
}

function buildModel() {
    const modelRule = rapture.object(rapture.scope()).keys({
        // If ref exists only it can exist
        // If type does not exist then ref must exist
        ref: rapture.string(),

        // if extends exists then properties must exist
        extend: rapture.string(),

        // If ref does not exist then type must exist
        type: rapture.string().valid('object', 'array', 'string', 'number', 'boolean').define('modelType'),

        //* default can only exist if type exists and type === 'string'|'number'|'boolean'|'date'
        default: rapture.if('modelType', rapture.assertions.isValue('string'), rapture.string())
                      .elseif('modelType', modelType => modelType === 'number', rapture.number())
                      .elseif('modelType', modelType => modelType === 'boolean', rapture.boolean())
                      .elseif('modelType', modelType => modelType === 'date', rapture.date()))

        //* Must exist if extends exists
        //* Must exist if type  === 'object' otherwise cannot exist
        //* Must not exist if ref exists
        properties: rapture.object().keys({
            [standardPropertyPattern]: rapture.defer(() => modelRule)
        }),

        // Must exist if type  === 'array' otherwise cannot exist
        items: rapture.defer(() => modelRule)
    })
    // Must have type|ref|extend
    .xor('type', 'ref', 'extend')
    // Cannot declare any other property if ref exists.
    .without('ref', ['default', 'properties', 'items'])
    // Cannot decalre default or items when extend exists
    .without('extend', ['default', 'items'])
    // If default exists then type must exist
    .with('default', 'type');
    // If extends exists then properties must exist
    .with('extend', 'properties')
    // if type  === 'array' items is required, otherwise it is forbidden
    .if('modelType', modelType => modelType === 'object', rapture.object().required('properties').forbidden('items', 'default'))
    .elseif('modelType', modelType => modelType === 'array', rapture.object().required('items').forbidden('properties', 'default'))
    .else(rapture.object().forbidden('properties', 'items'));

    return modelRule
    .define({
        // THeoreticaly schemas should be complete when this runs.
        id: 'artifactModel', // required, can be an array
        when: 'tree', // enum: ['always', 'this', 'tree'], default: this
        where: 'artifact', // predefined values ['session', 'artifact', 'local'], default: current scope
        with: ['schemas', (schemas, model) => {
            // const schemas = _.slice(args, 0, args.length - 2);
            return Parser.model(model, schemas);
        }], // default: this, can be an array
    })
}

function buildCommandsRule () {
    return rapture.array(rapture.object().keys({
        // string
        // required
        // Min length 1
        id: rapture.string().min(1).define([(commandId) => `command/${commandId}`]),
        condition: rapture.string().min(1).allow(null)
    }).required('id'));
}

module.exports = {
    buildModelRule
    buildCommandsRule,
    buildAssetRule,
    buildRulesRule,
    patterns: {
        standardPropertyPattern
    }
};
