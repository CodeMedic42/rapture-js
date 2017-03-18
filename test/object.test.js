/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Rapture = require('../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('Object Tests', () => {
    it('is an object', () => {
        const testObject = {};
        const testData = JSON.stringify(testObject);

        const rule = Rapture.object();
        expect(rule, 'Rule Definition is created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'One issue found.').to.be.equal(0);
    });

    it('is an array', () => {
        const testObject = [];
        const testData = JSON.stringify(testObject);

        const rule = Rapture.object();
        expect(rule, 'Rule is created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'One issue found.').to.be.equal(1);

        expect(issues[0].type, 'Issue type').to.be.equal('schema');
        expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(0);
        expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(0);
        expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(0);
        expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(0);
        expect(issues[0].message, 'Issue Message').to.be.equal('When defined this field must be a plain object');
        expect(issues[0].cause, 'Issue cause').to.be.equal('');
        expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    });

    it('is null', () => {
        const testObject = null;
        const testData = JSON.stringify(testObject);

        const rule = Rapture.object();
        expect(rule, 'Rule Definition is created').to.be.exist();

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'One issue found.').to.be.equal(0);
    });

    it('is not an object,... at first', () => {
        return new Promise((resolve) => {
            const testObject = [];
            const testData = JSON.stringify(testObject);

            const rule = Rapture.object();
            expect(rule, 'Rule is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist();

            context.on('update', (issues) => {
                expect(issues, 'Issues is an array').to.be.instanceOf(Array);
                expect(issues.length, 'Zero issues found.').to.be.equal(0);

                resolve();
            });

            const firstIssues = context.issues();

            expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
            expect(firstIssues.length, 'One issue found.').to.be.equal(1);

            const testObjectUpdate = {};
            const testDataUpdate = JSON.stringify(testObjectUpdate);
            context.update(testDataUpdate);
        });
    });

    describe('keys', () => {
        it('no keys - pass', () => {
            const testObject = {};
            const testData = JSON.stringify(testObject);

            const rule = Rapture.object().keys({});

            expect(rule, 'Rule Definition is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist();

            const firstIssues = context.issues();

            expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
            expect(firstIssues.length, 'One issue found.').to.be.equal(0);
        });

        it('no keys - fail', () => {
            const testObject = {
                notAllowed: 'foo'
            };
            const testData = JSON.stringify(testObject, null, 2);

            const rule = Rapture.object().keys({});

            expect(rule, 'Rule Definition is created').to.be.exist();

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
            expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(2);
            expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(14);
            expect(issues[0].message, 'Issue Message').to.be.equal('The property "notAllowed" is not allowed to exist.');
            expect(issues[0].cause, 'Issue cause').to.be.equal('notAllowed');
            expect(issues[0].severity, 'Issue severity').to.be.equal('error');
        });

        it('double keys - pass', () => {
            const testObject = {
                notAllowed: 'foo',
                allowed: 'test'
            };
            const testData = JSON.stringify(testObject, null, 2);

            const rule = Rapture.object().keys({
                allowed: Rapture.string()
            }).keys({
                notAllowed: Rapture.string()
            });

            expect(rule, 'Rule Definition is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist();

            const issues = context.issues();

            expect(issues, 'Issues is an array').to.be.instanceOf(Array);
            expect(issues.length, 'One issue found.').to.be.equal(0);
        });

        it('specfic key - does not exist - not required', () => {
            const testObject = {};
            const testData = JSON.stringify(testObject);

            const rule =
            Rapture.object().keys({
                allowed: Rapture.string()
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

        it('specfic key - does not exist - required', () => {
            const testObject = {};
            const testData = JSON.stringify(testObject);

            const rule = Rapture.object().keys({
                allowed: Rapture.string()
            }).required('allowed');

            expect(rule, 'Rule Definition is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist();

            const issues = context.issues();

            expect(issues, 'Issues is an array').to.be.instanceOf(Array);
            expect(issues.length, 'One issue found.').to.be.equal(1);

            expect(issues[0].type, 'Issue type').to.be.equal('schema');
            expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(0);
            expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(0);
            expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(0);
            expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(0);
            expect(issues[0].message, 'Issue Message').to.be.equal('A value is required');
            expect(issues[0].cause, 'Issue cause').to.be.equal('');
            expect(issues[0].severity, 'Issue severity').to.be.equal('error');
        });
    });

    describe('register', () => {
        it('should register', () => {
            const testObject = {
                id: 'foo'
            };
            const testData = JSON.stringify(testObject);

            const rule = Rapture.object().keys({
                id: Rapture.string().register('idAlias', '__artifact')
            });
            expect(rule, 'Rule Definition is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.exist();

            const issues = context.issues();

            expect(issues, 'Issues is an array').to.be.instanceOf(Array);
            expect(issues.length, 'No issues found.').to.equal(0);

            const scopeValue = context.scope.get('idAlias');

            expect(scopeValue.value, 'IdAlias should exist and be correct').to.equal(testObject.id);
            expect(scopeValue.status, 'IdAlias should exist and be correct').to.equal('ready');
        });
    });
});
