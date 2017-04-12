const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const FS = require('fs');
const Path = require('path');
const Rule = require('./rule.js');
const Rapture = require('../../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('Target Test', () => {
    it('Package.json', () => {
        const testData = FS.readFileSync(Path.join(__dirname, './testData.json')).toString();

        expect(Rule, 'Rule Definition is created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', Rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'Zero issues found.').to.be.equal(0);
    });
});
