/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Rapture = require('../../../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

function isType(type) {
    return Rapture.logic({
        require: 'typeValue',
        onValid: (control, content, params) =>
            control.set(params.typeValue === type)
    });
}

describe('If Tests :', () => {
    it('Takes first path - success', () => {
        const rule = Rapture.object().valid({
            type: Rapture.string().register('typeValue')
        })
        .if(isType('foo'), (hook) => {
            return hook.valid({
                code: Rapture.string()
            });
        })
        .elseIf(isType('bar'), (hook) => {
            return hook.valid({
                code: Rapture.number()
            });
        })
        .endIf();

        expect(rule, 'Rule Definition is created').to.be.exist();

        const testObject = {
            type: 'foo',
            code: 'pass'
        };
        const testData = JSON.stringify(testObject, null, 2);

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'No issues found.').to.be.equal(0);
    });

    it('Takes second path - fail', () => {
        const rule = Rapture.object().valid({
            type: Rapture.string().register('typeValue')
        })
        .if(isType('foo'), (hook) => {
            return hook.valid({
                code: Rapture.string()
            });
        })
        .elseIf(isType('bar'), (hook) => {
            return hook.valid({
                code: Rapture.number()
            });
        })
        .endIf();

        expect(rule, 'Rule Definition is created').to.be.exist();

        const testObject = {
            type: 'foo',
            code: 42
        };
        const testData = JSON.stringify(testObject, null, 2);

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'No issues found.').to.be.equal(1);

        expect(firstIssues[0].type, 'Issue type').to.be.equal('schema');
        expect(firstIssues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(2);
        expect(firstIssues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(2);
        expect(firstIssues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(2);
        expect(firstIssues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(8);
        expect(firstIssues[0].message, 'Issue Message').to.be.equal('When defined this field must be a string.');
        expect(firstIssues[0].cause, 'Issue cause').to.be.equal('code');
        expect(firstIssues[0].severity, 'Issue severity').to.be.equal('error');
    });

    it('Takes second path - success', () => {
        const rule = Rapture.object().valid({
            type: Rapture.string().register('typeValue')
        })
        .if(isType('foo'), (hook) => {
            return hook.valid({
                code: Rapture.string()
            });
        })
        .elseIf(isType('bar'), (hook) => {
            return hook.valid({
                code: Rapture.number()
            });
        })
        .endIf();

        expect(rule, 'Rule Definition is created').to.be.exist();

        const testObject = {
            type: 'bar',
            code: 42
        };
        const testData = JSON.stringify(testObject, null, 2);

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'No issues found.').to.be.equal(0);
    });

    it('Takes second path - fail', () => {
        const rule = Rapture.object().valid({
            type: Rapture.string().register('typeValue')
        })
        .if(isType('foo'), (hook) => {
            return hook.valid({
                code: Rapture.string()
            });
        })
        .elseIf(isType('bar'), (hook) => {
            return hook.valid({
                code: Rapture.number()
            });
        })
        .endIf();

        expect(rule, 'Rule Definition is created').to.be.exist();

        const testObject = {
            type: 'bar',
            code: 'fail'
        };
        const testData = JSON.stringify(testObject, null, 2);

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'No issues found.').to.be.equal(1);

        expect(firstIssues[0].type, 'Issue type').to.be.equal('schema');
        expect(firstIssues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(2);
        expect(firstIssues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(2);
        expect(firstIssues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(2);
        expect(firstIssues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(8);
        expect(firstIssues[0].message, 'Issue Message').to.be.equal('When defined this field must be a number.');
        expect(firstIssues[0].cause, 'Issue cause').to.be.equal('code');
        expect(firstIssues[0].severity, 'Issue severity').to.be.equal('error');
    });

    it('No path taken - fail', () => {
        const rule = Rapture.object().strict().valid({
            type: Rapture.string().register('typeValue')
        })
        .if(isType('foo'), (hook) => {
            return hook.valid({
                code: Rapture.string()
            });
        })
        .elseIf(isType('bar'), (hook) => {
            return hook.valid({
                code: Rapture.number()
            });
        })
        .endIf();

        expect(rule, 'Rule Definition is created').to.be.exist();

        const testObject = {
            type: 'baz',
            code: 42
        };
        const testData = JSON.stringify(testObject, null, 2);

        const session = Rapture.createSessionContext();
        expect(session, 'Session is created').to.be.exist();

        const context = session.createArtifactContext('artifactID', rule, testData);
        expect(context, 'context is created').to.be.exist();

        const firstIssues = context.issues();

        expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
        expect(firstIssues.length, 'One issue found.').to.be.equal(1);

        expect(firstIssues[0].type, 'Issue type').to.be.equal('schema');
        expect(firstIssues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(2);
        expect(firstIssues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(2);
        expect(firstIssues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(2);
        expect(firstIssues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(8);
        expect(firstIssues[0].message, 'Issue Message').to.be.equal('The property "code" is not allowed to exist.');
        expect(firstIssues[0].cause, 'Issue cause').to.be.equal('code');
        expect(firstIssues[0].severity, 'Issue severity').to.be.equal('error');
    });
});
