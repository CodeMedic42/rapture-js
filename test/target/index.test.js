const Rapture = require('rapture');
const metadataRuleDefinition = require('./metadataRuleDefinition.js');

const artifactRule = metadataRuleDefinition();

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

const sessionContext = Rapture.createSession(); // Need to add rules here

const artifactContext = sessionContext.createArtifactContext('artifactID', artifactRule, artifactA);

artifactContext.issues();
artifactContext.update('');
artifactContext.on('update', (issues) => {
});

sessionContext.issues(); // Will return all issues for session only
sessionContext.issues(true); // Will return all issues for session and all artifacts
