/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Rapture = require('../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

function pass(testObject, rule) {
    const testData = JSON.stringify(testObject);

    expect(rule, 'Rule Definition is created').to.be.exist();

    const session = Rapture.createSessionContext();
    expect(session, 'Session is created').to.be.exist();

    const context = session.createArtifactContext('artifactID', rule, testData);
    expect(context, 'context is created').to.be.exist();

    const firstIssues = context.issues();

    expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
    expect(firstIssues.length, 'Zero issues found.').to.be.equal(0);
}

function fail(testObject, rule, expectedFailItems) {
    const testData = JSON.stringify(testObject);

    expect(rule, 'Rule is created').to.be.exist();

    const session = Rapture.createSessionContext();
    expect(session, 'Session is created').to.be.exist();

    const context = session.createArtifactContext('artifactID', rule, testData);
    expect(context, 'context is created').to.be.exist();

    const issues = context.issues();

    expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    expect(issues.length, 'One issue found.').to.be.equal(1);

    expect(issues[0].type, 'Issue type').to.be.equal(expectedFailItems.type);
    expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(expectedFailItems.rowStart);
    expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(expectedFailItems.rowEnd);
    expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(expectedFailItems.columnStart);
    expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(expectedFailItems.columnEnd);
    expect(issues[0].message, 'Issue Message').to.be.equal(expectedFailItems.message);
    expect(issues[0].cause, 'Issue cause').to.be.equal(expectedFailItems.cause);
    expect(issues[0].severity, 'Issue severity').to.be.equal(expectedFailItems.severity);
}

function failCount(testObject, rule, count) {
    const testData = JSON.stringify(testObject);

    expect(rule, 'Rule is created').to.be.exist();

    const session = Rapture.createSessionContext();
    expect(session, 'Session is created').to.be.exist();

    const context = session.createArtifactContext('artifactID', rule, testData);
    expect(context, 'context is created').to.be.exist();

    const issues = context.issues();

    expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    expect(issues.length, 'One issue found.').to.be.equal(count);
}

describe('Object Tests', () => {
    describe('Rule - plain Object', () => {
        it('is an empty object', () => {
            const testObject = {};

            const rule = Rapture.object();

            pass(testObject, rule);
        });

        it('is an object with a property', () => {
            const testObject = {
                foo: 'foo'
            };

            const rule = Rapture.object();

            pass(testObject, rule);
        });

        it('is an array', () => {
            const testObject = [];

            const rule = Rapture.object();

            fail(testObject, rule, {
                type: 'schema',
                rowStart: 0,
                rowEnd: 0,
                columnStart: 0,
                columnEnd: 0,
                message: 'When defined this field must be a plain object',
                cause: '',
                severity: 'error'
            });
        });

        it('is null', () => {
            const testObject = null;

            const rule = Rapture.object();

            pass(testObject, rule);
        });
    });

    describe('update', () => {
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

                context.on('raise', () => {
                    const issues = context.issues();

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
    });

    describe('keys', () => {
        it('no keys - pass', () => {
            const testObject = {};

            const rule = Rapture.object().keys({});

            pass(testObject, rule);
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

            const rule = Rapture.object().keys({
                allowed: Rapture.string()
            }).keys({
                notAllowed: Rapture.string()
            });

            pass(testObject, rule);
        });

        it('specfic key - does not exist - not required', () => {
            const testObject = {};

            const rule = Rapture.object().keys({
                allowed: Rapture.string()
            });

            pass(testObject, rule);
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
            expect(issues[0].message, 'Issue Message').to.be.equal('The property "allowed" is required');
            expect(issues[0].cause, 'Issue cause').to.be.equal('');
            expect(issues[0].severity, 'Issue severity').to.be.equal('error');
        });

        it('multi-object', () => {
            const testObject = {
                objA: {
                    objB: {
                        str: 'foo'
                    }
                }
            };

            const rule = Rapture.object().keys({
                objA: Rapture.object().keys({
                    objB: Rapture.object().keys({
                        str: Rapture.string()
                    })
                })
            });

            pass(testObject, rule);
        });

        it('multi-object - fail', () => {
            const testObject = {
                objA: {
                    objB: 'foo'
                }
            };
            const testData = JSON.stringify(testObject, null, 2);

            const rule = Rapture.object().keys({
                objA: Rapture.object().keys({
                    objB: Rapture.object().keys({
                        str: Rapture.string()
                    })
                })
            });

            expect(rule, 'Rule Definition is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist();

            const issues = context.issues();

            expect(issues, 'Issues is an array').to.be.instanceOf(Array);
            expect(issues.length, 'One issue found.').to.be.equal(1);

            expect(issues[0].type, 'Issue type').to.be.equal('schema');
            expect(issues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(2);
            expect(issues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(2);
            expect(issues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(4);
            expect(issues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(10);
            expect(issues[0].message, 'Issue Message').to.be.equal('When defined this field must be a plain object');
            expect(issues[0].cause, 'Issue cause').to.be.equal('objA.objB');
            expect(issues[0].severity, 'Issue severity').to.be.equal('error');
        });

        it('Dynamic Keys', () => {
            const testObject = {
                A: 'foo',
                B: 'bar',
                C: 'baz'
            };

            const rule = Rapture.object().keys((setupContext) => {
                setupContext.define('keys', (keysSetupContext) => {
                    keysSetupContext.onRun(() => {
                        return ['A', 'B', 'C'];
                    });
                });

                setupContext.onRun((runContext, contents, params) => {
                    return _.reduce(params.keys, (current, id) => {
                        const cur = current;

                        cur[id] = Rapture.string();

                        return cur;
                    }, {});
                });
            });

            pass(testObject, rule);
        });

        it('Dynamic Keys - never load', () => {
            const testObject = {
                A: 'foo',
                B: 'bar',
                C: 42,
                D: 'test'
            };
            const testData = JSON.stringify(testObject);

            const rule = Rapture.object().keys((setupContext) => {
                setupContext.require('keys');

                setupContext.onRun(() => {
                    // Should not call because "keys" dones not exist
                    expect().fail();
                });
            });

            expect(rule, 'Rule Definition is created').to.be.exist();

            const session = Rapture.createSessionContext();
            expect(session, 'Session is created').to.be.exist();

            const context = session.createArtifactContext('artifactID', rule, testData);
            expect(context, 'context is created').to.be.exist();

            const firstIssues = context.issues();

            expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
            expect(firstIssues.length, 'One issue found.').to.be.equal(1);

            expect(firstIssues[0].type, 'Issue type').to.be.equal('Rule');
            expect(firstIssues[0].location.rowStart, 'Issue location.rowStart.').to.be.equal(0);
            expect(firstIssues[0].location.rowEnd, 'Issue location.rowEnd').to.be.equal(0);
            expect(firstIssues[0].location.columnStart, 'Issue location.columnStart').to.be.equal(0);
            expect(firstIssues[0].location.columnEnd, 'Issue location.columnEnd').to.be.equal(0);
            expect(firstIssues[0].message, 'Issue Message').to.be.equal('Required rule value "keys" is not defined.');
            expect(firstIssues[0].cause, 'Issue cause').to.be.equal('');
            expect(firstIssues[0].severity, 'Issue severity').to.be.equal('warning');
        });

        it('Dynamic Keys - fail', () => {
            const testObject = {
                A: 'foo',
                B: 'bar',
                C: 42,
                D: 'test'
            };

            const rule = Rapture.object().keys((setupContext) => {
                setupContext.define('keys', (keysSetupContext) => {
                    keysSetupContext.onRun(() => {
                        return ['A', 'B', 'C'];
                    });
                });

                setupContext.onRun((runContext, contents, params) => {
                    return _.reduce(params.keys, (current, id) => {
                        const cur = current;

                        cur[id] = Rapture.string();

                        return cur;
                    }, {});
                });
            });

            failCount(testObject, rule, 2);
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
