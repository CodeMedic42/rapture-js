/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Rapture = require('../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('String Tests', () => {
    it('is a string', () => {
        const testObject = {
            strValue: 'valid'
        };
        const testData = JSON.stringify(testObject);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string()
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'One issue found.').to.be.equal(0);
    });

    it('is not a string', () => {
        const testObject = {
            strValue: 42
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string()
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'One issue found.').to.be.equal(1);

        expect(issues[0].type, 'Issue type').to.be.equal('schema');
        expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(1);
        expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(1);
        expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(4);
        expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(14);
        expect(issues[0].message, 'Issue Message').to.be.equal('When defined this field must be a string.');
        expect(issues[0].cause, 'Issue cause').to.be.equal('strValue');
        expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    });

    it('is a string with min', () => {
        const testObject = {
            strValue: 'four'
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string().min(4)
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'One issue found.').to.be.equal(0);
    });

    it('is a string with min - fail', () => {
        const testObject = {
            strValue: 'foo'
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string().min(4)
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'One issue found.').to.be.equal(1);

        expect(issues[0].type, 'Issue type').to.be.equal('schema');
        expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(1);
        expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(1);
        expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(4);
        expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(14);
        expect(issues[0].message, 'Issue Message').to.be.equal('Must be greater than 3 characters long.');
        expect(issues[0].cause, 'Issue cause').to.be.equal('strValue');
        expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    });

    it('is a string with min - loaded', () => {
        const testObject = {
            strValue: 'four'
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string().min((setupContext) => {
                setupContext.onRun(() => {
                    return 4;
                });
            })
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'One issue found.').to.be.equal(0);
    });

    it('is a string with min - loaded - fail', () => {
        const testObject = {
            strValue: 'foo'
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string().min((setupContext) => {
                setupContext.onRun(() => {
                    return 4;
                });
            })
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'One issue found.').to.be.equal(1);

        expect(issues[0].type, 'Issue type').to.be.equal('schema');
        expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(1);
        expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(1);
        expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(4);
        expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(14);
        expect(issues[0].message, 'Issue Message').to.be.equal('Must be greater than 3 characters long.');
        expect(issues[0].cause, 'Issue cause').to.be.equal('strValue');
        expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    });

    it('is a string with max', () => {
        const testObject = {
            strValue: 'foo'
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string().max(4)
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'No issues found.').to.be.equal(0);
    });

    it('is a string with max - fail', () => {
        const testObject = {
            strValue: 'foobar'
        };
        const testData = JSON.stringify(testObject, null, 4);

        const rule =
        Rapture.object().keys({
            strValue: Rapture.string().max(4)
        });

        expect(rule, 'Rule has been created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'One issue found.').to.be.equal(1);

        expect(issues[0].type, 'Issue type').to.be.equal('schema');
        expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(1);
        expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(1);
        expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(4);
        expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(14);
        expect(issues[0].message, 'Issue Message').to.be.equal('Must be less than 5 characters long.');
        expect(issues[0].cause, 'Issue cause').to.be.equal('strValue');
        expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    });
});
