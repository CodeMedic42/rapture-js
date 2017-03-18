const _ = require('lodash');
const Rapture = require('../../src');
const metadataRuleDefinition = require('./metadataRuleDefinition.js');

const artifactRule = metadataRuleDefinition();

const testData = {
    id: 'foo',
    schema: {
        name: 'workflow',
        version: '1.2.3'
    },
    version: '1.2.3',
    // model: {}
};

const artifactA = JSON.stringify(testData);

const sessionContext = Rapture.createSessionContext(); // Need to add rules here

const artifactContext = sessionContext.createArtifactContext('artifactID', artifactRule, artifactA);

const firstIssues = artifactContext.issues();

if (firstIssues && firstIssues.length > 0) {
    console.error('Expected no issues');

    _.forEach(firstIssues, (issue) => {
        console.log(issue.message);
    });
}

artifactContext.on('update', (issues) => {
    console.log('Update called');

    if (issues && issues.length > 0) {
        console.error('Expected no issues');

        _.forEach(firstIssues, (issue) => {
            console.log(issue.message);
        });
    }
});
