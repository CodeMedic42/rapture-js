/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Console = require('console');
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

    _.forEach(firstIssues, issue => Console.log(issue.message));

    expect(firstIssues.length, 'Zero issues found.').to.be.equal(0);
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
}

function failWithException(testObject, rule, expectedMessage) {
    const testData = JSON.stringify(testObject, null, 2);

    expect(rule, 'Rule is created').to.be.exist();

    const session = Rapture.createSessionContext();
    expect(session, 'Session is created').to.be.exist();

    try {
        session.createArtifactContext('artifactID', rule, testData);

        expect.fail();
    } catch (err) {
        expect(err.message).to.be.equal(expectedMessage);
    }
}

// function failCount(testObject, rule, count) {
//     const testData = JSON.stringify(testObject);
//
//     expect(rule, 'Rule is created').to.be.exist();
//
//     const session = Rapture.createSessionContext();
//     expect(session, 'Session is created').to.be.exist();
//
//     const context = session.createArtifactContext('artifactID', rule, testData);
//     expect(context, 'context is created').to.be.exist();
//
//     const issues = context.issues();
//
//     expect(issues, 'Issues is an array').to.be.instanceOf(Array);
//     expect(issues.length, 'One issue found.').to.be.equal(count);
// }

describe('Object Tests :', () => {
    describe('Rule Object :', () => {
        describe('Rule called once :', () => {
            it('Empty object', () => {
                const testObject = {};

                const rule = Rapture.object();

                pass(testObject, rule);
            });

            it('Object with a property', () => {
                const testObject = {
                    foo: 'foo'
                };

                const rule = Rapture.object();

                pass(testObject, rule);
            });

            it('Not an object', () => {
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

            it('Is null', () => {
                const testObject = null;

                const rule = Rapture.object();

                pass(testObject, rule);
            });
        });

        it('Rule cannot be called twice :', () => {
            const rule = Rapture.object();

            expect(rule.object).to.not.exist();
        });
    });

    describe('Rule - Keys :', () => {
        describe('No options :', () => {
            const option = null;

            describe('Rule called once :', () => {
                describe('Parameter - Empty :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(undefined, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = {
                            validKey: 'foo'
                        };

                        const rule = Rapture.object().keys(undefined, option);

                        pass(testObject, rule);
                    });
                });

                describe('Parameter - Empty object :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({}, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({}, option);

                        fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 1,
                            rowEnd: 1,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });
                });

                describe('Parameter - Object with single key("validKey") :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 1,
                            rowEnd: 1,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = { validKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with keys("validKey", "invalidKey")', () => {
                        const testObject = { validKey: 'foo', invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 2,
                            rowEnd: 2,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });
                });

                describe('Parameter - Rapture logic :', () => {
                    describe('Does not result in a plain object :', () => {
                        it('Results in null', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return null; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Results in Rapture logic', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return Rapture.logic({
                                        onRun: () => {
                                            return {};
                                        }
                                    });
                                }
                            }), option);

                            fail(testObject, rule, {
                                type: 'rule',
                                rowStart: 0,
                                rowEnd: 0,
                                columnStart: 0,
                                columnEnd: 0,
                                message: 'Keys must either be undefined, null, or a plain object',
                                cause: '',
                                severity: 'error'
                            });
                        });
                    });

                    it('Never loads', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(Rapture.logic({
                            require: 'willNotExist',
                            onRun: () => {
                                // Should not call because "keys" dones not exist
                                expect().fail();
                            }
                        }), option);

                        fail(testObject, rule, {
                            type: 'rule',
                            rowStart: 0,
                            rowEnd: 0,
                            columnStart: 0,
                            columnEnd: 0,
                            message: 'Required rule value "willNotExist" is not defined.',
                            cause: '',
                            severity: 'warning'
                        });
                    });

                    describe('Results in empty object :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    describe('Results in object with single key("validKey") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKey")', () => {
                            const testObject = { validKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKey", "invalidKey")', () => {
                            const testObject = { validKey: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });

                xit('Parameter - Neither', () => {});
            });

            describe('Rule called twice :', () => {
                describe('First param empty object :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });

                describe('First param with single key("validKeyA") :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA, validKeyB")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 3,
                                rowEnd: 3,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });
            });
        });

        describe('Option allowAll is true :', () => {
            const option = {
                allowAll: true
            };

            describe('Rule called once :', () => {
                describe('Parameter - Empty :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(undefined, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = {
                            validKey: 'foo'
                        };

                        const rule = Rapture.object().keys(undefined, option);

                        pass(testObject, rule);
                    });
                });

                describe('Parameter - Empty object :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({}, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({}, option);

                        pass(testObject, rule);
                    });
                });

                describe('Parameter - Object with single key("validKey") :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = { validKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with keys("validKey", "invalidKey")', () => {
                        const testObject = { validKey: 'foo', invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        pass(testObject, rule);
                    });
                });

                describe('Parameter - Rapture logic :', () => {
                    describe('Does not result in a plain object :', () => {
                        it('Results in null', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return null; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Results in Rapture logic', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return Rapture.logic({
                                        onRun: () => {
                                            return {};
                                        }
                                    });
                                }
                            }), option);

                            fail(testObject, rule, {
                                type: 'rule',
                                rowStart: 0,
                                rowEnd: 0,
                                columnStart: 0,
                                columnEnd: 0,
                                message: 'Keys must either be undefined, null, or a plain object',
                                cause: '',
                                severity: 'error'
                            });
                        });
                    });

                    it('Never loads', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(Rapture.logic({
                            require: 'willNotExist',
                            onRun: () => {
                                // Should not call because "keys" dones not exist
                                expect().fail();
                            }
                        }), option);

                        fail(testObject, rule, {
                            type: 'rule',
                            rowStart: 0,
                            rowEnd: 0,
                            columnStart: 0,
                            columnEnd: 0,
                            message: 'Required rule value "willNotExist" is not defined.',
                            cause: '',
                            severity: 'warning'
                        });
                    });

                    describe('Results in empty object :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            pass(testObject, rule);
                        });
                    });

                    describe('Results in object with single key("validKey") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKey")', () => {
                            const testObject = { validKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKey", "invalidKey")', () => {
                            const testObject = { validKey: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            pass(testObject, rule);
                        });
                    });
                });
            });

            describe('Rule called twice :', () => {
                describe('First param empty object :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            pass(testObject, rule);
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });
                    });
                });

                describe('First param with single key("validKeyA") :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            pass(testObject, rule);
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA, validKeyB")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            pass(testObject, rule);
                        });
                    });
                });
            });
        });
    });

    describe('Rule - Match :', () => {
        const matchKey = /^\d+-validKey$/;
        const matchKeyB = /^\d+-validKeyB$/;
        describe('No options :', () => {
            const option = null;

            describe('Rule called once :', () => {
                it('Parameter - Rule Empty', () => {
                    try {
                        Rapture.object().match(null, 'validMatch', option);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.be.equal('Rule is required');
                    }
                });

                describe('Parameter - Matcher Empty :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().match(Rapture.any(), undefined, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = {
                            validKey: 'foo'
                        };

                        const rule = Rapture.object().match(Rapture.any(), undefined, option);

                        pass(testObject, rule);
                    });
                });

                describe('Parameter - Matcher Regex :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().match(Rapture.any(), matchKey, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().match(Rapture.any(), matchKey, option);

                        fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 1,
                            rowEnd: 1,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });

                    it('Test data - Object with key("1-validKey", "2-validKey")', () => {
                        const testObject = { '1-validKey': 'foo', '2-validKey': 'foo' };

                        const rule = Rapture.object().match(Rapture.any(), matchKey, option);

                        pass(testObject, rule);
                    });

                    it('Test data - Object with keys("validKey", "invalidKey")', () => {
                        const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', invalidKey: 'foo' };

                        const rule = Rapture.object().match(Rapture.any(), matchKey, option);

                        fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 3,
                            rowEnd: 3,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });
                });

                describe('Parameter - Matcher array :', () => {
                    describe('of regex :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().match(Rapture.any(), [matchKey, matchKeyB], option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().match(Rapture.any(), [matchKey, matchKeyB], option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("1-validKey", "2-validKey", "1-validKeyB", "2-validKeyB")', () => {
                            const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', '1-validKeyB': 'foo', '2-validKeyB': 'foo' };

                            const rule = Rapture.object().match(Rapture.any(), [matchKey, matchKeyB], option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("1-validKey", "2-validKey", "1-validKeyB", "2-validKeyB", "invalidKey")', () => {
                            const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', '1-validKeyB': 'foo', '2-validKeyB': 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().match(Rapture.any(), [matchKey, matchKeyB], option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 5,
                                rowEnd: 5,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    it('of neither', () => {
                        try {
                            Rapture.object().match(Rapture.any(), [42], option);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.be.equal('Only regular expressions are allowed to be enumerated');
                        }
                    });
                });

                describe('Parameter - Matcher Rapture logic :', () => {
                    describe('Does not result in a matcher :', () => {
                        it('Results in null', () => {
                            const testObject = {};

                            const rule = Rapture.object().match(Rapture.any(), Rapture.logic({
                                onRun: () => { return null; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Results in a number', () => {
                            const testObject = {};

                            const rule = Rapture.object().match(Rapture.any(), Rapture.logic({
                                onRun: () => {
                                    return 42;
                                }
                            }), option);

                            failWithException(testObject, rule, 'Only regular expressions, arrays of regular expressions, or Rapture logic objects which result in either of the first two are allowed');
                        });
                    });

                    it('Never loads', () => {
                        const testObject = {};

                        const rule = Rapture.object().match(Rapture.any(), Rapture.logic({
                            require: 'willNotExist',
                            onRun: () => {
                                // Should not call because "keys" dones not exist
                                expect().fail();
                            }
                        }), option);

                        fail(testObject, rule, {
                            type: 'rule',
                            rowStart: 0,
                            rowEnd: 0,
                            columnStart: 0,
                            columnEnd: 0,
                            message: 'Required rule value "willNotExist" is not defined.',
                            cause: '',
                            severity: 'warning'
                        });
                    });

                    it('Results in an array of regular expressions:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return [matchKey, matchKeyB]; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return [matchKey, matchKeyB]; }
                            }), option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKey", "2-validKey, 1-validKey", "2-validKey",")', () => {
                            const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', '1-validKeyB': 'foo', '2-validKeyB': 'foo', };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return [matchKey, matchKeyB]; }
                            }), option);

                            pass(testObject, rule);
                        });

                        it('Test data - Object with keys("1-validKey", "2-validKey", 1-validKeyB", "2-validKeyB", "invalidKey")', () => {
                            const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', '1-validKeyB': 'foo', '2-validKeyB': 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return [matchKey, matchKeyB]; }
                            }), option);

                            fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });

                it('Parameter - Neither', () => {
                    try {
                        Rapture.object().match(Rapture.any(), 42, option);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.be.equal('Only regular expressions, arrays of regular expressions, or Rapture logic objects which result in either of the first two are allowed');
                    }
                });
            });
        });

        describe('Option allowAll is true :', () => {

        });
    });

    describe('Rule - Required :', () => {});

    describe('Rule - Xor :', () => {});

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

        it('property name change', () => {
            return new Promise((resolve) => {
                const testObject = {
                    foo: 'bar'
                };
                const testData = JSON.stringify(testObject);

                const rule = Rapture.object().keys({
                    foo: Rapture.string()
                });
                expect(rule, 'Rule is created').to.be.exist();

                const session = Rapture.createSessionContext();
                expect(session, 'Session is created').to.be.exist();

                const context = session.createArtifactContext('artifactID', rule, testData);
                expect(context, 'context is created').to.be.exist();

                context.on('raise', () => {
                    const issues = context.issues();

                    expect(issues, 'Issues is an array').to.be.instanceOf(Array);
                    expect(issues.length, 'One issue found.').to.be.equal(1);

                    resolve();
                });

                const firstIssues = context.issues();

                expect(firstIssues, 'Issues is an array').to.be.instanceOf(Array);
                expect(firstIssues.length, 'Zero issues found.').to.be.equal(0);

                const testObjectUpdate = {
                    baz: 'bar'
                };
                const testDataUpdate = JSON.stringify(testObjectUpdate);

                context.update(testDataUpdate);
            });
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

/* old
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
*/
