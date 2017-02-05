const _ = require('lodash');
const ObservableList = require('observableList');

const standardPropertyPattern = /^[-\w\d]+$/;
const specialPropertyPattern = /^[-\w\d:]+$/;

// When defining a value
//      If it passed validation then it is marked as ready
//      If it fails validation then it is marked as failed
//
// When using a defined value
//      If it is marked as ready then use it
//      If it is marked as failed then report an error saying that the validation cannot continue untill it is resolved
//      If it is marked as undefined then report an error saying that an expected value was not defined.

// function checkForCircularReference(parentRefs) {
//     // Check Circular dependancy.
//     const index = _.findIndex(parentRefs, by => by === this.params.lookingFor);
//
//     if (index >= 0) {
//         this.raise('circularReference', 'Cannot have a circular reference.');
//
//         this.params.targetRefs.merge(parentRefs);
//     } else {
//         this.clear();
//
//         // This probably will not work could conflict with others.
//         // Need to splend some time to think about this.
//         this.params.targetRefs.remove(parentRefs);
//     }
// }
//
// function circOnRun(componentId) {
//     this.params.lookingFor = `${this.params.componentType}/${componentId}`;
//
//     this.params.references.off('change', checkForCircularReference, this);
//     this.params.references.on('change', checkForCircularReference, this);
//
//     checkForCircularReference.call(this, this.params.references);
// }
//
// function circOnPause() {
//     this.referencedBy.off('change', refByOnChange, this);
// }
//
// function rulesSchema(conditionRequired) {
//     let ruleSchema = null;
//
//     const ruleArray = rapture.array().items(rapture.defer(() => ruleSchema));
//
//     const expression = rapture.string().min(1);
//
//     const expressionArray = rapture.array().items(expression).min(1);
//
//     const action = rapture.is(rapture.string(), expression)
//                         .elseIs(rapture.array(), expressionArray),
//                         .elseIs(rapture.object(),rapture.object().keys({
//                                 expression: rapture.is(rapture.string(), expression)
//                                                  .elseIs(rapture.array(), expressionArray),
//                                 then: rapture.defer(() => ruleSchema),
//                                 catch: rapture.defer(() => ruleSchema)
//                             }).required('expression');
//                         );
//
//     const ruleObject = rapture.object().keys({
//         condition: conditionRequired ? conditionSchema : conditionSchema.allow(null),
//         action,
//         parallel: ruleArray,
//         series: ruleArray,
//         oneOf: ruleArray
//     })
//     .xor('parallel', 'oneOf', 'series', 'action')
//     .without('condition', 'parallel', 'oneOf', 'series');
//
//     if (conditionRequired) {
//         ruleObject = ruleObject.with('action', 'condition');
//     }
//
//     ruleSchema = rapture.is(rapture.string(), => expression)
//                       .elseIs(rapture.object(), ruleObject)
//                       .elseIs(rapture.array(), expressionArray);
//
//     return ruleSchema;
// }
//
// function buildHandlersSchema(commandsAllowed, routesAllowed) {
//     const keys = {
//         expression: rulesSchema(false),
//         output: rapture.object().keys({
//             [standardPropertyPattern]: rapture.any()
//         })
//     };
//
//     if (routesAllowed) {
//         keys.route = rapture.string().allow('').defined([(routeID) => `route/${routeID}`]);
//     }
//
//     if (commandsAllowed) {
//         keys.command = rapture.string().defined([(commandID) => `command/${commandID}`]);;
//     }
//
//     let handlerSchema = rapture.object().keys(keys);
//
//     if (routesAllowed && commandsAllowed) {
//         handlerSchema = handlerSchema.nand('command', 'route');
//     }
//
//     return rapture.object().keys({
//         [standardPropertyPattern]: handlerSchema
//     });
// }
//
// function buildAssetRule(commandsAllowed, routesAllowed)
//     return rapture.object(rapture.scope('asset')).keys({
//         id: rapture.string().define('bindingID', 'asset'),
//         component: rapture.object().keys({
//             id: rapture.string()
//                 .custom(function circularSetup() {
//                     this.require('fullArtifactID');
//                     this.require('references');
//                     this.require('componentType');
//                     this.require('targetRefs', function targetRefsSetup() {
//                         this.require('componentType');
//                         this.onRun(function targetRefsOnRun(componentId) {
//                             return `${this.params.componentType}/${componentId}.referencedBy`;
//                         });
//                     });
//                     //this.require('targetRefs', '${componentType}/${this}.referencedBy');
//
//                     this.onRun(circOnRun);
//                     this.onPause(circOnPause);
//                 })
//                 .define('componentId', 'asset')
//             type: rapture.string()
//                 .if('workflowType', (workflowType) => { return workflowType === 'process'; }, rapture.string().valid('workflow', 'status'))
//                 .elseIf('workflowType', (workflowType) => { return workflowType === 'presentation'; }, rapture.string().valid('workflow', 'screen'))
//                 .define('componentType', 'asset'),
//             version: rapture.version()
//         }).required('id', 'type', 'version'),
//         input: Joi.object()
//         .custom(function bindingSetup() {
//             this.require('destionationModel', '${componentType}/${componentId}.model');
//             this.require('sourceModel', 'artifactModel');
//
//             this.onRun(function bindingOnRun(tokenContext) {
//             });
//
//             this.onPause(function bindingOnPause() {
//             });
//         });
//         handlers: buildHandlersSchema(commandsAllowed, routesAllowed);
//     })
//     .required('id', 'component', 'input', 'handlers');
//     .define(['bindingId', (bindingId) => `asset/${bindingId}`], 'artifact')
//     .define(['bindingId', (bindingId) => `asset/${bindingId}/component`], 'artifact', '${componentType}/${componentId}');
// }
//
// const modelRule = rapture.object(rapture.scope()).keys({
//     // If ref exists only it can exist
//     // If type does not exist then ref must exist
//     ref: rapture.string(),
//
//     // if extends exists then properties must exist
//     extend: rapture.string(),
//
//     // If ref does not exist then type must exist
//     type: rapture.string().valid('object', 'array', 'string', 'number', 'boolean').define('modelType'),
//
//     //* default can only exist if type exists and type === 'string'|'number'|'boolean'|'date'
//     default: rapture.if('modelType', rapture.assertions.isValue('string'), rapture.string())
//                   .elseif('modelType', modelType => modelType === 'number', rapture.number())
//                   .elseif('modelType', modelType => modelType === 'boolean', rapture.boolean())
//                   .elseif('modelType', modelType => modelType === 'date', rapture.date()))
//
//     //* Must exist if extends exists
//     //* Must exist if type  === 'object' otherwise cannot exist
//     //* Must not exist if ref exists
//     properties: rapture.object().keys({
//         [standardPropertyPattern]: rapture.defer(() => modelRule)
//     }),
//
//     // Must exist if type  === 'array' otherwise cannot exist
//     items: rapture.defer(() => modelRule)
// })
// // Must have type|ref|extend
// .xor('type', 'ref', 'extend')
// // Cannot declare any other property if ref exists.
// .without('ref', ['default', 'properties', 'items'])
// // Cannot decalre default or items when extend exists
// .without('extend', ['default', 'items'])
// // If default exists then type must exist
// .with('default', 'type');
// // If extends exists then properties must exist
// .with('extend', 'properties')
// // if type  === 'array' items is required, otherwise it is forbidden
// .if('modelType', modelType => modelType === 'object', rapture.object().required('properties').forbidden('items', 'default'))
// .elseif('modelType', modelType => modelType === 'array', rapture.object().required('items').forbidden('properties', 'default'))
// .else(rapture.object().forbidden('properties', 'items'));
//
// const definedModelRule = modelRule
// .define({
//     // THeoreticaly schemas should be complete when this runs.
//     id: 'artifactModel', // required, can be an array
//     when: 'tree', // enum: ['always', 'this', 'tree'], default: this
//     where: 'artifact', // predefined values ['session', 'artifact', 'local'], default: current scope
//     with: ['schemas', (schemas, model) => {
//         // const schemas = _.slice(args, 0, args.length - 2);
//         return Parser.model(model, schemas);
//     }], // default: this, can be an array
// })
//
// const commandsRule = rapture.array(rapture.object().keys({
//     // string
//     // required
//     // Min length 1
//     id: rapture.string().min(1).define([(commandId) => `command/${commandId}`]),
//     condition: rapture.string().min(1).allow(null)
// }).required('id'));
//
// const routesRule = rapture.array().min(1).items(rapture.object().keys({
//     // string
//     // required
//     // min length 1
//     route: rapture.string().allow('').define((route) => `route/${route}`),
//     // follows rules schema
//     // Not required
//     // No min
//     // condition not required
//     expression: rulesSchema(false).allow(null),
//     // string
//     // required
//     // min length 1
//     // must ref a component in this workflow
//     state: rapture.string().defined([(start) => `asset/${state}`])
// }).required('route', 'state'));
//
// const redirectsRule = rapture.array().items(
//     rapture.object().keys({
//         condition: Schemas.ConditionSchema,
//         route: rapture.string().min(1)
//     }).required('route', 'condition');
// );
//
// function buildWorkflow() {
//     return rapture.object().keys({
//         model: definedModelRule,
//         type: rapture.string().valid('presentation', 'process').define('workflowType', 'artifact'),
//         states: rapture.array().min(1).items(buildAssetRule(true, true)),
//         routes: routesRule,
//         start: rapture.string().defined([(start) => `route/${start}`]),
//         redirect: redirectsRule,
//         commands: commandsRule,
//         rules: rapture.any()
//     }).required('model', 'type', 'states', 'start', 'routes');
// }
//
// function buildSchema() {
//     return rapture.object().keys({
//         model: modelRule.define(),
//     }).required('model');
// }
//
// function buildApplication() {
//     return rapture.object().keys({
//     });
// }
//
// function buildStatus() {
//     return rapture.object().keys({
//         model: definedModelRule,
//         presentation: buildAssetRule(true, false),
//         commands: commandsRule,
//         rules: rapture.any()
//     }).required('model', 'presentation');
// }
//
// const layoutRule = rapture.object(rapture.scope()).keys({
//     view: rapture.string().defined(function viewDefinedSetup() {
//         this.onRun(function viewDefinedOnRun(value) {
//             return `asset/${value}`;
//         });
//     }).define('targetView', function viewDefineSetup() {
//         this.require('childKeys', function viewDefineTargetSetup() {
//             this.require('targetComponent', () => {
//                 this.require('targetComponentId', () => {
//                     this.onRun((value) => {
//                         return `asset/${value}/component`;
//                     })
//                 });
//
//                 this.onRun(() => {
//                     return this.params.targetComponentId;
//                 });
//             });
//             this.onRun(function viewDefineTargetOnRun(value) {
//                 this
//                 return `asset/${value}/component`;
//             });
//         });
//
//         this.onRun(function viewDefineOnRun() {
//             return this.params.target;
//         });
//     }),
//
//
//     children: rapture.object().keys(function childrenKeysSetup() {
//         this.require('targetView');
//         this.onRun(function childrenKeysOnRun() {
//
//         });
//     })
// });
//
// "layout": {
//     "view": "container",
//     "children": {
//       "content": {
//         "view": "beneficiaries-content"
//       }
//     }
//   },
//
// function buildScreen() {
//     return rapture.object().keys({
//         model: definedModelRule,
//         views: rapture.array().min(1).items(buildAssetRule(true, false)),
//         layout: layoutRule
//         commands: commandsRule,
//         rules: rapture.any()
//     }).required('model', 'presentation');
// }
//
// const component = rapture.object();
//
// function reduceToKeys(properties, set) {
//     return _.reduce(properties, (keys, prop) => {
//         keys[prop] = set;
//
//         return keys;
//     }, {});
// }
//
// function buildView() {
//     return rapture.object().keys({
//         model: definedModelRule,
//         components: rapture.array().min(1).items(component),
//         commands: commandsRule,
//         rules: rapture.object().keys({
//             system: rapture.object().keys({
//                 ready: rulesSchema(false),
//                 'load:view': rulesSchema(false)
//             }),
//             model: rapture.object().keys(function modelKeysSetup() {
//                 this.required('artifactModel');
//
//                 this.onRun(function modelKeysOnRun(tokenContext) {
//                     const model = this.params.artifactModel;
//
//                     return {
//                         properties: rapture.object().keys(function propertiesKeysSetup() {
//                             this.onRun(function propertiesKeysOnRun(tokenContext) => {
//                                 return reduceToKeys(model.properties, rulesSchema(false));
//                             };
//                         })
//                     };
//                 });
//             }),
//             components: rapture.object().keys(function componentsKeysSetup() {
//                 this.required('components');
//
//                 this.onRun(function componentsKeysOnRun(tokenContext) {
//                     return _.reduce(this.components, (keys, prop) => {
//                         keys[prop] = rapture.object().keys({
//                                 events: rapture.object().keys(function eventsKeysSetup() {
//                                     this.require('events', `component/${prop}/events`);
//
//                                     this.onRun(function eventsKeysOnRun(tokenContext) {
//                                         return reduceToKeys(this.params.events, rulesSchema(false));
//                                     });
//                                 })
//                             })
//                         });
//
//                         return keys;
//                     }, {});
//                 });
//             });
//         })
//     }).required('model', 'presentation');
// }

// const artifactRule = rapture.object().keys({
//     schema: rapture.object().keys({
//         name: rapture.string().define('artifactType', 'artifactContext'),
//         version: rapture.version(),
//     }).required('name', 'version'),
//     id: rapture.string().define('fullArtifactID', 'artifact', (setupContext) => {
//         setupContext.require('artifactType');
//         setupContext.onRun((runContext, propertyValue) => {
//             return `${runContext.params.artifactType}/${propertyValue}`
//         });
//     }),
//     version: rapture.version()
// }).required('schema', 'id', 'version')
// .if('artifactType', (type) => { return type === 'application'; }, buildApplication())
// .elseIf('artifactType', (type) => { return type === 'workflow'; }, buildWorkflow())
// .elseIf('artifactType', (type) => { return type === 'status'; }, buildStatus())
// .elseIf('artifactType', (type) => { return type === 'screen'; }, buildScreen())
// .elseIf('artifactType', (type) => { return type === 'view'; }, buildView())
// .elseIf('artifactType', (type) => { return type === 'schema'; }, buildSchema())
//
// .define((setupContext) => {
//     setupContext.require('fullArtifactID', 'ready');
//     setupContext.onRun((runContext, propertyValue) => {
//         return `${runContext.params.fullArtifactID}.model`;
//     });
// },
// 'session',
// (setupContext) => {
//     setupContext.require('artifactModel', 'ready');
//     setupContext.onRun((runContext, propertyValue) => {
//         return runContext.params.artifactModel;
//     });
// })
//
// .define('references', 'aritfact', (setupContext) => {
//     setupContext.onRun(() => {
//         return new ObservableList();
//     });
// })
//
// .define((setupContext) => {
//     setupContext.require('fullArtifactID');
//     setupContext.onRun((runContext, propertyValue) => {
//         return `${runContext.params.fullArtifactID}.referencedBy`;
//     });
// },
// 'session',
// (setupContext) => {
//     setupContext.require('references');
//     setupContext.require('fullArtifactID');
//
//     setupContext.onRun((runContext, propertyValue) => {
//         runContext.params.references.push(fullArtifactID);
//
//         return runContext.params.references;
//     });
// })
// .define('schemas', 'artifact', (setupContext) => {
//     setupContext.onRun(() => {
//         return new ObservableList();
//     });
// });

// Atom Linter

const testData = {
    id: 'foo',
    schema: {
        name: 'workflow',
        version: '1.2.3'
    },
    version: '1.2.3',
    model: {}
};

const artifactA = JSON.parse(testData);

const sessionContext = rapture.createSession(); // Need to add rules here

const artifactContext = sessionContext.createArtifactContext('artifactID', artifactRule, artifactA);

artifactContext.issues();
artifactContext.update('');
artifactContext.on('update', (issues) => {
});

sessionContext.issues(); // Will return all issues for session only
sessionContext.issues(true); // Will return all issues for session and all artifacts
