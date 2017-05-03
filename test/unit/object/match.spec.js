const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

Chai.use(DirtyChai);

const expect = Chai.expect;

module.exports = () => {
    describe('Rule - Match :', () => {
        const matchKey = /^\d+-validKey$/;
        const matchKeyB = /^\d+-validKeyB$/;
        describe('No options :', () => {
            describe('Rule called once :', () => {
                it('Parameter - Rule Empty', () => {
                    try {
                        Rapture.object().valid('validMatch', null);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.be.equal('Rule is required');
                    }
                });

                describe('Parameter - Matcher Empty :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().valid(undefined, Rapture.any());

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = {
                            validKey: 'foo'
                        };

                        const rule = Rapture.object().valid(undefined, Rapture.any());

                        TestingSupport.pass(testObject, rule);
                    });
                });

                describe('Parameter - Matcher Regex :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().valid(matchKey, Rapture.any());

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().valid(matchKey, Rapture.any()).strict();

                        TestingSupport.fail(testObject, rule, {
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

                        const rule = Rapture.object().valid(matchKey, Rapture.any());

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with keys("validKey", "invalidKey")', () => {
                        const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', invalidKey: 'foo' };

                        const rule = Rapture.object().valid(matchKey, Rapture.any()).strict();

                        TestingSupport.fail(testObject, rule, {
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

                            const rule = Rapture.object().valid([matchKey, matchKeyB], Rapture.any());

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().valid([matchKey, matchKeyB], Rapture.any()).strict();

                            TestingSupport.fail(testObject, rule, {
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

                            const rule = Rapture.object().valid([matchKey, matchKeyB], Rapture.any());

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("1-validKey", "2-validKey", "1-validKeyB", "2-validKeyB", "invalidKey")', () => {
                            const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', '1-validKeyB': 'foo', '2-validKeyB': 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().valid([matchKey, matchKeyB], Rapture.any()).strict();

                            TestingSupport.fail(testObject, rule, {
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
                            Rapture.object().valid([42], Rapture.any());

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.be.equal('Must be either a string, regular expression, an array of the former two, or a Rapture Logic definition if not already loaded through one');
                        }
                    });
                });

                describe('Parameter - Matcher Rapture logic :', () => {
                    describe('Does not result in a matcher :', () => {
                        it('Results in null', () => {
                            const testObject = {};

                            const rule = Rapture.object().valid(Rapture.logic({
                                onRun: () => { return null; }
                            }), Rapture.any());

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Results in a number', () => {
                            const testObject = {};

                            const rule = Rapture.object().valid(Rapture.logic({
                                onRun: () => {
                                    return 42;
                                }
                            }), Rapture.any());

                            TestingSupport.failWithException(testObject, rule, 'Must be either a string, regular expression, an array of the former two, or a Rapture Logic definition if not already loaded through one');
                        });
                    });

                    it('Never loads', () => {
                        const testObject = {};

                        const rule = Rapture.object().valid(Rapture.logic({
                            require: 'willNotExist',
                            onRun: () => {
                                // Should not call because "keys" dones not exist
                                expect.fail();
                            }
                        }), Rapture.any()).strict();

                        TestingSupport.fail(testObject, rule, {
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
                            }), Rapture.any());

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return [matchKey, matchKeyB]; }
                            }), Rapture.any()).strict();

                            TestingSupport.fail(testObject, rule, {
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
                            }), Rapture.any());

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("1-validKey", "2-validKey", 1-validKeyB", "2-validKeyB", "invalidKey")', () => {
                            const testObject = { '1-validKey': 'foo', '2-validKey': 'foo', '1-validKeyB': 'foo', '2-validKeyB': 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return [matchKey, matchKeyB]; }
                            }), Rapture.any()).strict();

                            TestingSupport.fail(testObject, rule, {
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
                        Rapture.object().valid(42, Rapture.any());

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.be.equal('Must be either a string, regular expression, an array of the former two, or a Rapture Logic definition if not already loaded through one');
                    }
                });
            });
        });

        describe('Option allowAll is true :', () => {

        });
    });
};
