/* eslint-disable import/no-extraneous-dependencies */
const chai = require('chai');
const Rapture = require('../src');

const expect = chai.expect;

describe('Object Tests', function mainTest() {

    it('is an object', () => {
        const testObject = {};
        const testData = JSON.stringify(testObject);

        const rule = Rapture.object();
        expect(rule, 'Rule Definition is created').to.be.exist;

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist;

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist;

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'No issues found.').to.be.equal(0);
    });

    it('is an array', () => {
        const testObject = [];
        const testData = JSON.stringify(testObject);

        const rule = Rapture.object();
        expect(rule, 'Rule is created').to.be.exist;

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist;

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist;

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
        expect(rule, 'Rule Definition is created').to.be.exist;

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist;

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist;

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'No issues found.').to.be.equal(0);
    });

    it('is not an object,... at first', (done) => {
        const testObject = [];
        const testData = JSON.stringify(testObject);

        const rule = Rapture.object();
        expect(rule, 'Rule is created').to.be.exist;

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist;

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist;

        const issues = context.issues();

        expect(issues, 'Issues is an array').to.be.instanceOf(Array);
        expect(issues.length, 'One issue found.').to.be.equal(1);

        context.on('update', (newIssues) => {
            expect(newIssues, 'Issues is an array').to.be.instanceOf(Array);
            expect(newIssues.length, 'Zero issues found.').to.be.equal(0);

            done();
        });

        const testObjectUpdate = {};
        const testDataUpdate = JSON.stringify(testObjectUpdate);

        context.update(testDataUpdate);
    });

    // describe('required', () => {
    //     it('exists', () => {
    //         const testObject = {};
    //         const testData = JSON.stringify(testObject);
    //
    //         const ruleDefinition = rapture.object().required();
    //         expect(ruleDefinition, 'Rule Definition is created').to.be.exist;
    //
    //         const session = rapture.createSession(ruleDefinition);
    //         expect(session, 'Session is created').to.be.exist;
    //
    //         const context = session.createContext(testData);
    //         expect(context, 'context is created').to.be.exist;
    //
    //         const issues = context.issues();
    //
    //         expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    //         expect(issues.length, 'No issues found.').to.be.equal(0);
    //     });
    //
    //     it('null', () => {
    //         const testObject = null;
    //         const testData = JSON.stringify(testObject);
    //
    //         const ruleDefinition = rapture.object().required();
    //         expect(ruleDefinition, 'Rule Definition is created').to.be.exist;
    //
    //         const session = rapture.createSession(ruleDefinition);
    //         expect(session, 'Session is created').to.be.exist;
    //
    //         const context = session.createContext(testData);
    //         expect(context, 'context is created').to.be.exist;
    //
    //         const issues = context.issues();
    //
    //         expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    //         expect(issues.length, 'One issue found.').to.be.equal(1);
    //
    //         expect(issues[0].type, 'Issue type').to.be.equal('schema');
    //         expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(0);
    //         expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(0);
    //         expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(0);
    //         expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(0);
    //         expect(issues[0].message, 'Issue Message').to.be.equal('A value is required');
    //         expect(issues[0].cause, 'Issue cause').to.be.equal('');
    //         expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    //     });
    // });

    describe('keys', () => {
        it('no keys - pass', () => {
            const testObject = {};
            const testData = JSON.stringify(testObject);

            const rule = Rapture.object().keys({});

            expect(rule, 'Rule Definition is created').to.be.exist;

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist;

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist;

            const issues = context.issues();

            expect(issues, 'Issues is an array').to.be.instanceOf(Array);
            expect(issues.length, 'No issues found.').to.be.equal(0);
        });

        it('no keys - fail', () => {
            const testObject = {
                'notAllowed': 'foo'
            };
            const testData = JSON.stringify(testObject, null, 2);

            const rule = Rapture.object().keys({});

            expect(rule, 'Rule Definition is created').to.be.exist;

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist;

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist;

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

    //     it('specfic key - does not exist - not required', () => {
    //         const testObject = {};
    //         const testData = JSON.stringify(testObject);
    //
    //         const ruleDefinition =
    //         rapture.object().keys({
    //             'allowed': rapture.string()
    //         });
    //
    //         expect(ruleDefinition, 'Rule Definition is created').to.be.exist;
    //
    //         const session = rapture.createSession(ruleDefinition);
    //         expect(session, 'Session is created').to.be.exist;
    //
    //         const context = session.createContext(testData);
    //         expect(context, 'context is created').to.be.exist;
    //
    //         const issues = context.issues();
    //
    //         expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    //         expect(issues.length, 'No issues found.').to.be.equal(0);
    //     });
    //
    //     it('specfic key - does not exist - required', () => {
    //         const testObject = {};
    //         const testData = JSON.stringify(testObject);
    //
    //         const ruleDefinition =
    //         rapture.object().keys({
    //             'allowed': rapture.string().required()
    //         });
    //
    //         expect(ruleDefinition, 'Rule Definition is created').to.be.exist;
    //
    //         const session = rapture.createSession(ruleDefinition);
    //         expect(session, 'Session is created').to.be.exist;
    //
    //         const context = session.createContext(testData);
    //         expect(context, 'context is created').to.be.exist;
    //
    //         const issues = context.issues();
    //
    //         expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    //         expect(issues.length, 'One issue found.').to.be.equal(1);
    //
    //         expect(issues[0].type, 'Issue type').to.be.equal('schema');
    //         expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(0);
    //         expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(0);
    //         expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(0);
    //         expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(0);
    //         expect(issues[0].message, 'Issue Message').to.be.equal('A value is required');
    //         expect(issues[0].cause, 'Issue cause').to.be.equal('');
    //         expect(issues[0].severity, 'Issue severity').to.be.equal('error');
    //     });
    });

    // describe('register', () => {
    //     it('should register', () => {
    //         const testObject = {
    //             id: 'foo'
    //         };
    //         const testData = JSON.stringify(testObject);
    //
    //         const ruleDefinition = rapture.object().keys({
    //             'id': rapture.string().register('idAlias')
    //         });
    //         expect(ruleDefinition, 'Rule Definition is created').to.be.exist;
    //
    //         const session = rapture.createSession(ruleDefinition);
    //         expect(session, 'Session is created').to.exist;
    //
    //         const context = session.createContext(testData);
    //         expect(context, 'context is created').to.exist;
    //
    //         const issues = context.issues();
    //
    //         expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    //         expect(issues.length, 'No issues found.').to.equal(0);
    //
    //         expect(context.getAlias('idAlias'), 'IdAlias should exist and be correct').to.equal(testObject.id);
    //     });
    // });
});
