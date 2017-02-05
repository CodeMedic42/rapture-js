const standardPropertyPattern = /^[-\w\d]+$/;
const specialPropertyPattern = /^[-\w\d:]+$/;

function checkForCircularReference(parentRefs) {
    // Check Circular dependancy.
    const index = _.findIndex(parentRefs, by => by === this.params.lookingFor);

    if (index >= 0) {
        this.raise('circularReference', 'Cannot have a circular reference.');

        this.params.targetRefs.merge(parentRefs);
    } else {
        this.clear();

        // This probably will not work could conflict with others.
        // Need to splend some time to think about this.
        this.params.targetRefs.remove(parentRefs);
    }
}

function circOnRun(componentId) {
    this.params.lookingFor = `${this.params.componentType}/${componentId}`;

    this.params.references.off('change', checkForCircularReference, this);
    this.params.references.on('change', checkForCircularReference, this);

    checkForCircularReference.call(this, this.params.references);
}

function circOnPause() {
    this.referencedBy.off('change', refByOnChange, this);
}

function buildRulesRule(conditionRequired) {
    let ruleSchema = null;

    const ruleArray = jRule.array().items(jRule.defer(() => ruleSchema));

    const expression = jRule.string().min(1);

    const expressionArray = jRule.array().items(expression).min(1);

    const action = jRule.is(jRule.string(), expression)
                        .elseIs(jRule.array(), expressionArray),
                        .elseIs(jRule.object(),jRule.object().keys({
                                expression: jRule.is(jRule.string(), expression)
                                                 .elseIs(jRule.array(), expressionArray),
                                then: jRule.defer(() => ruleSchema),
                                catch: jRule.defer(() => ruleSchema)
                            }).required('expression');
                        );

    const ruleObject = jRule.object().keys({
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

    ruleSchema = jRule.is(jRule.string(), => expression)
                      .elseIs(jRule.object(), ruleObject)
                      .elseIs(jRule.array(), expressionArray);

    return ruleSchema;
}

function buildHandlersSchema(commandsAllowed, routesAllowed) {
    const keys = {
        expression: rulesSchema(false),
        output: jRule.object().keys({
            [standardPropertyPattern]: jRule.any()
        })
    };

    if (routesAllowed) {
        keys.route = jRule.string().allow('').defined([(routeID) => `route/${routeID}`]);
    }

    if (commandsAllowed) {
        keys.command = jRule.string().defined([(commandID) => `command/${commandID}`]);;
    }

    let handlerSchema = jRule.object().keys(keys);

    if (routesAllowed && commandsAllowed) {
        handlerSchema = handlerSchema.nand('command', 'route');
    }

    return jRule.object().keys({
        [standardPropertyPattern]: handlerSchema
    });
}

function buildAssetRule(commandsAllowed, routesAllowed)
    return jRule.object(jRule.scope('asset')).keys({
        id: jRule.string().define('bindingID', 'asset'),
        component: jRule.object().keys({
            id: jRule.string()
                .custom(function circularSetup() {
                    this.require('fullArtifactID');
                    this.require('references');
                    this.require('componentType');
                    this.require('targetRefs', function targetRefsSetup() {
                        this.require('componentType');
                        this.onRun(function targetRefsOnRun(componentId) {
                            return `${this.params.componentType}/${componentId}.referencedBy`;
                        });
                    });
                    //this.require('targetRefs', '${componentType}/${this}.referencedBy');

                    this.onRun(circOnRun);
                    this.onPause(circOnPause);
                })
                .define('componentId', 'asset')
            type: jRule.string()
                .if('workflowType', (workflowType) => { return workflowType === 'process'; }, jRule.string().valid('workflow', 'status'))
                .elseIf('workflowType', (workflowType) => { return workflowType === 'presentation'; }, jRule.string().valid('workflow', 'screen'))
                .define('componentType', 'asset'),
            version: jRule.version()
        }).required('id', 'type', 'version'),
        input: Joi.object()
        .custom(function bindingSetup() {
            this.require('destionationModel', '${componentType}/${componentId}.model');
            this.require('sourceModel', 'artifactModel');

            this.onRun(function bindingOnRun(tokenContext) {
            });

            this.onPause(function bindingOnPause() {
            });
        });
        handlers: buildHandlersSchema(commandsAllowed, routesAllowed);
    })
    .required('id', 'component', 'input', 'handlers');
    .define(['bindingId', (bindingId) => `asset/${bindingId}`], 'artifact')
    .define(['bindingId', (bindingId) => `asset/${bindingId}/component`], 'artifact', '${componentType}/${componentId}');
}

function buildModel() {
    const modelRule = jRule.object(jRule.scope()).keys({
        // If ref exists only it can exist
        // If type does not exist then ref must exist
        ref: jRule.string(),

        // if extends exists then properties must exist
        extend: jRule.string(),

        // If ref does not exist then type must exist
        type: jRule.string().valid('object', 'array', 'string', 'number', 'boolean').define('modelType'),

        //* default can only exist if type exists and type === 'string'|'number'|'boolean'|'date'
        default: jRule.if('modelType', jRule.assertions.isValue('string'), jRule.string())
                      .elseif('modelType', modelType => modelType === 'number', jRule.number())
                      .elseif('modelType', modelType => modelType === 'boolean', jRule.boolean())
                      .elseif('modelType', modelType => modelType === 'date', jRule.date()))

        //* Must exist if extends exists
        //* Must exist if type  === 'object' otherwise cannot exist
        //* Must not exist if ref exists
        properties: jRule.object().keys({
            [standardPropertyPattern]: jRule.defer(() => modelRule)
        }),

        // Must exist if type  === 'array' otherwise cannot exist
        items: jRule.defer(() => modelRule)
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
    .if('modelType', modelType => modelType === 'object', jRule.object().required('properties').forbidden('items', 'default'))
    .elseif('modelType', modelType => modelType === 'array', jRule.object().required('items').forbidden('properties', 'default'))
    .else(jRule.object().forbidden('properties', 'items'));

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
    return jRule.array(jRule.object().keys({
        // string
        // required
        // Min length 1
        id: jRule.string().min(1).define([(commandId) => `command/${commandId}`]),
        condition: jRule.string().min(1).allow(null)
    }).required('id'));
}

module.exports = {
    buildModelRule
    buildCommandsRule,
    buildAssetRule,
    buildRulesRule
};
