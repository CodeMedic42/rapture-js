const Rapture = require('rapture');
const ObservableList = require('observableList');
const buildApplicationRule = require('./application.js');
const buildWorkflowRule = require('./workflow.js');
const buildStatusRule = require('./status.js');
const buildScreenRule = require('./screen.js');
const buildSchemaRule = require('./schema.js');

function buildMetadataRuleDefinition() {
    return Rapture.object().keys({
        schema: Rapture.object().keys({
            name: Rapture.string().define('artifactType', 'artifactContext'),
            version: Rapture.version(),
        }).required('name', 'version'),
        id: Rapture.string().define('fullArtifactID', 'artifact', (setupContext) => {
            setupContext.require('artifactType');
            setupContext.onRun((runContext, propertyValue) => {
                return `${runContext.params.artifactType}/${propertyValue}`
            });
        }),
        version: Rapture.version()
    }).required('schema', 'id', 'version')
    .if('artifactType', (type) => { return type === 'application'; }, buildApplicationRule())
    .elseIf('artifactType', (type) => { return type === 'workflow'; }, buildWorkflowRule())
    .elseIf('artifactType', (type) => { return type === 'status'; }, buildStatusRule())
    .elseIf('artifactType', (type) => { return type === 'screen'; }, buildScreenRule())
    .elseIf('artifactType', (type) => { return type === 'view'; }, buildViewRule())
    .elseIf('artifactType', (type) => { return type === 'schema'; }, buildSchemaRule())

    .define((setupContext) => {
        setupContext.require('fullArtifactID', 'ready');
        setupContext.onRun((runContext, propertyValue) => {
            return `${runContext.params.fullArtifactID}.model`;
        });
    },
    'session',
    (setupContext) => {
        setupContext.require('artifactModel', 'ready');
        setupContext.onRun((runContext, propertyValue) => {
            return runContext.params.artifactModel;
        });
    })

    .define('references', 'aritfact', (setupContext) => {
        setupContext.onRun(() => {
            return new ObservableList();
        });
    })

    .define((setupContext) => {
        setupContext.require('fullArtifactID');
        setupContext.onRun((runContext, propertyValue) => {
            return `${runContext.params.fullArtifactID}.referencedBy`;
        });
    },
    'session',
    (setupContext) => {
        setupContext.require('references');
        setupContext.require('fullArtifactID');

        setupContext.onRun((runContext, propertyValue) => {
            runContext.params.references.push(fullArtifactID);

            return runContext.params.references;
        });
    })
    .define('schemas', 'artifact', (setupContext) => {
        setupContext.onRun(() => {
            return new ObservableList();
        });
    });
}

module.exports = buildMetadataRuleDefinition;
