/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
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
    expect(firstIssues.length, 'One issue found.').to.be.equal(0);

    return context;
}

function fail(testObject, rule, expectedFailItems) {
    const testData = JSON.stringify(testObject, null, 2);

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

    return context;
}

describe('Registration Tests', () => {
    it('Register at current scope', () => {
        const testObject = {
            reg: 'foo',
            peak: 'bar'
        };

        let called = false;

        const rule = Rapture.object().keys({
            reg: Rapture.string().register('testReg'),
            peak: Rapture.string().custom(Rapture.logic({
                require: 'testReg',
                onRun: (control, contents, params) => {
                    called = true;

                    expect(params.testReg).to.equal(testObject.reg);
                }
            }))
        });

        const context = pass(testObject, rule);

        expect(called).to.be.true();

        const artifactValue = context.scope.get('testReg');
        expect(artifactValue, 'artifactValue should not exist').to.not.exist();

        const sessionValue = context.scope.parentScope.get('testReg');
        expect(sessionValue, 'sessionValue should not exist').to.not.exist();
    });

    it('Register at artifact scope', () => {
        const testObject = {
            reg: 'foo',
            peak: 'bar'
        };

        let called = false;

        const rule = Rapture.object().keys({
            reg: Rapture.string().register('testReg', '__artifact'),
            peak: Rapture.string().custom(Rapture.logic({
                require: 'testReg',
                onRun: (control, contents, params) => {
                    called = true;

                    expect(params.testReg).to.equal(testObject.reg);
                }
            }))
        });

        const context = pass(testObject, rule);

        expect(called).to.be.true();

        const artifactValue = context.scope.get('testReg');
        expect(artifactValue, 'artifactValue should exist').to.exist();
        expect(artifactValue.value, 'artifactValue value should exist and be correct').to.equal(testObject.reg);
        expect(artifactValue.status, 'artifactValue status should exist and be correct').to.equal('ready');

        const sessionValue = context.scope.parentScope.get('testReg');
        expect(sessionValue, 'sessionValue should not exist').to.not.exist();
    });

    it('Register at session scope', () => {
        const testObject = {
            reg: 'foo',
            peak: 'bar'
        };

        let called = false;

        const rule = Rapture.object().keys({
            reg: Rapture.string().register('testReg', '__session'),
            peak: Rapture.string().custom(Rapture.logic({
                require: 'testReg',
                onRun: (control, contents, params) => {
                    called = true;

                    expect(params.testReg).to.equal(testObject.reg);
                }
            }))
        });

        const context = pass(testObject, rule);

        expect(called).to.be.true();

        const artifactValue = context.scope.get('testReg');
        expect(artifactValue, 'artifactValue should exist').to.exist();
        expect(artifactValue.value, 'artifactValue value should exist and be correct').to.equal(testObject.reg);
        expect(artifactValue.status, 'artifactValue status should exist and be correct').to.equal('ready');

        const sessionValue = context.scope.parentScope.get('testReg');
        expect(sessionValue, 'sessionValue should exist').to.exist();
        expect(sessionValue.value, 'sessionValue value should exist and be correct').to.equal(testObject.reg);
        expect(sessionValue.status, 'sessionValue status should exist and be correct').to.equal('ready');
    });

    it('Does register fails when validation fails', () => {
        const testObject = {
            reg: 42,
            peak: 'bar'
        };

        const rule = Rapture.object().keys({
            reg: Rapture.string().register('testReg', '__session'),
            peak: Rapture.string().custom(Rapture.logic({
                require: 'testReg',
                onRun: () => {
                    expect.fail();
                }
            }))
        });

        const context = fail(testObject, rule, {
            type: 'schema',
            rowStart: 1,
            rowEnd: 1,
            columnStart: 2,
            columnEnd: 7,
            message: 'When defined this field must be a string.',
            cause: 'reg',
            severity: 'error'
        });

        const artifactValue = context.scope.get('testReg');
        expect(artifactValue, 'artifactValue should exist').to.exist();
        expect(artifactValue.value, 'artifactValue value should exist and be correct').to.equal(testObject.reg);
        expect(artifactValue.status, 'artifactValue status should exist and be correct').to.equal('failed');

        const sessionValue = context.scope.parentScope.get('testReg');
        expect(sessionValue, 'sessionValue should exist').to.exist();
        expect(sessionValue.value, 'sessionValue value should exist and be correct').to.equal(testObject.reg);
        expect(sessionValue.status, 'sessionValue status should exist and be correct').to.equal('failed');
    });

    it('Does register passes even if later rule fails', () => {
        const testObject = {
            reg: 'foo',
            peak: 'bar'
        };

        let called = false;

        const rule = Rapture.object().keys({
            reg: Rapture.string().register('testReg', '__session').min(5).register('testReg2', '__session'),
            peak: Rapture.string().custom(Rapture.logic({
                require: 'testReg',
                onRun: (control, contents, params) => {
                    called = true;

                    expect(params.testReg).to.equal(testObject.reg);
                }
            }))
        });

        const context = fail(testObject, rule, {
            type: 'schema',
            rowStart: 1,
            rowEnd: 1,
            columnStart: 2,
            columnEnd: 7,
            message: 'Must be greater than 4 characters long.',
            cause: 'reg',
            severity: 'error'
        });

        expect(called).to.be.true();

        const artifactValue = context.scope.get('testReg');
        expect(artifactValue, 'artifactValue should exist').to.exist();
        expect(artifactValue.value, 'artifactValue value should exist and be correct').to.equal(testObject.reg);
        expect(artifactValue.status, 'artifactValue status should exist and be correct').to.equal('ready');

        const sessionValue = context.scope.parentScope.get('testReg');
        expect(sessionValue, 'sessionValue should exist').to.exist();
        expect(sessionValue.value, 'sessionValue value should exist and be correct').to.equal(testObject.reg);
        expect(sessionValue.status, 'sessionValue status should exist and be correct').to.equal('ready');

        const artifactValue2 = context.scope.get('testReg2');
        expect(artifactValue2, 'artifactValue2 should exist').to.exist();
        expect(artifactValue2.value, 'artifactValue2 value should exist and be correct').to.equal(testObject.reg);
        expect(artifactValue2.status, 'artifactValue2 status should exist and be correct').to.equal('failed');

        const sessionValue2 = context.scope.parentScope.get('testReg2');
        expect(sessionValue2, 'sessionValue2 should exist').to.exist();
        expect(sessionValue2.value, 'sessionValue2 value should exist and be correct').to.equal(testObject.reg);
        expect(sessionValue2.status, 'sessionValue2 status should exist and be correct').to.equal('failed');
    });

    describe('register at different scope', () => {
        it('test', () => {
            const testObject = {
                highReg: 'foo',
                highPeak: 'bar',
                subObj: {
                    lowReg: 'faz',
                    lowPeak: 'baz',
                }
            };

            let highPeakCalled = false;
            let lowPeakCalled = false;

            const rule = Rapture.object().keys({
                highReg: Rapture.string().register('testRegHigh'),
                highPeak: Rapture.string().custom(Rapture.logic({
                    require: ['testRegHigh', 'testRegLow'],
                    onRun: (control, contents, params) => {
                        highPeakCalled = true;

                        expect(params.testRegHigh).to.equal(testObject.highReg);
                        expect(params.testRegLow).to.equal(testObject.lowReg);
                    }
                })),
                subObj: Rapture.scope('scopeA').object().keys({
                    lowReg: Rapture.string().register('testRegLow'),
                    lowPeak: Rapture.string().custom(Rapture.logic({
                        require: ['testRegHigh', 'testRegLow'],
                        onRun: (control, contents, params) => {
                            lowPeakCalled = true;

                            expect(params.testRegHigh).to.equal(testObject.highReg);
                            expect(params.testRegLow).to.equal(testObject.subObj.lowReg);
                        }
                    }))
                })
            });

            const context = fail(testObject, rule, {
                type: 'rule',
                rowStart: 2,
                rowEnd: 2,
                columnStart: 2,
                columnEnd: 12,
                message: 'Required rule value "testRegLow" is not defined.',
                cause: 'highPeak',
                severity: 'warning'
            });

            expect(highPeakCalled).to.be.false();
            expect(lowPeakCalled).to.be.true();

            const artifactValue = context.scope.get('testReg');
            expect(artifactValue, 'artifactValue should not exist').to.not.exist();

            const sessionValue = context.scope.parentScope.get('testReg');
            expect(sessionValue, 'sessionValue should not exist').to.not.exist();
        });
    });
});
